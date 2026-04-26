import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUrlSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

function generateShortCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // GET all URLs
  app.get("/api/urls", async (_req: Request, res: Response) => {
    const urls = await storage.getAllUrls();
    const formatted = urls.map((u) => ({
      id: u.id,
      shortCode: u.shortCode,
      destination: u.destination,
      clicks: u.clicks,
      created: formatDate(u.createdAt),
      createdAt: u.createdAt,
    }));
    res.json(formatted);
  });

  // POST create URL
  app.post("/api/urls", async (req: Request, res: Response) => {
    const result = insertUrlSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }

    const { destination, shortCode: requestedSlug } = result.data;
    let shortCode = requestedSlug || generateShortCode();

    // Ensure unique slug
    const existing = await storage.getUrlByShortCode(shortCode);
    if (existing) {
      return res.status(409).json({ error: { shortCode: ["That slug is already taken"] } });
    }

    const url = await storage.createUrl({ destination, shortCode });
    res.status(201).json({
      id: url.id,
      shortCode: url.shortCode,
      destination: url.destination,
      clicks: url.clicks,
      created: formatDate(url.createdAt),
      createdAt: url.createdAt,
    });
  });

  // DELETE a URL
  app.delete("/api/urls/:id", async (req: Request, res: Response) => {
    await storage.deleteUrl(req.params.id);
    res.status(204).end();
  });

  // GET analytics summary
  app.get("/api/analytics/summary", async (_req: Request, res: Response) => {
    const urls = await storage.getAllUrls();
    const totalClicks = urls.reduce((sum, u) => sum + u.clicks, 0);
    const clicksToday = await storage.getTodayClicksCount();
    res.json({
      totalUrls: urls.length,
      totalClicks,
      clicksToday,
    });
  });

  // GET click analytics for a specific URL (last 7 days)
  app.get("/api/urls/:id/analytics", async (req: Request, res: Response) => {
    const { id } = req.params;
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const clicks = await storage.getClicksByUrlIdSince(id, since);

    // Build chart data for last 7 days
    const chartData: { date: string; clicks: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const count = clicks.filter(
        (c) => c.clickedAt >= d && c.clickedAt < next
      ).length;

      chartData.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        clicks: count,
      });
    }

    // Referrer breakdown
    const referrerMap: Record<string, number> = {};
    const allClicks = await storage.getClicksByUrlId(id);
    for (const c of allClicks) {
      const src = c.referrer || "Direct";
      try {
        const host = new URL(src).hostname;
        referrerMap[host] = (referrerMap[host] || 0) + 1;
      } catch {
        referrerMap["Direct"] = (referrerMap["Direct"] || 0) + 1;
      }
    }

    const referrers = Object.entries(referrerMap)
      .map(([source, count]) => ({ source, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    res.json({ chartData, referrers });
  });

  // Redirect short URL (must come last)
  app.get("/:shortCode", async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    // Skip Vite/API routes
    if (shortCode.startsWith("api") || shortCode.startsWith("assets") || shortCode.startsWith("src")) {
      return res.status(404).json({ error: "Not found" });
    }

    const url = await storage.getUrlByShortCode(shortCode);
    if (!url) {
      return res.redirect(`/?notFound=${shortCode}`);
    }

    await storage.incrementClicks(url.id);
    await storage.recordClick({
      urlId: url.id,
      referrer: req.headers.referer || null,
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip || null,
    });

    res.redirect(301, url.destination);
  });

  const httpServer = createServer(app);
  return httpServer;
}
