import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUrlSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { parse as csvParse } from "csv-parse/sync";
import geoip from "geoip-lite";

// ── Helpers ──────────────────────────────────────────────────────
function generateShortCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || "";
}

function lookupGeo(ip: string): { country: string | null; city: string | null } {
  try {
    const geo = geoip.lookup(ip);
    return { country: geo?.country ?? null, city: geo?.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}

// ── API-key middleware ────────────────────────────────────────────
async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"] as string | undefined;
  if (!key) return res.status(401).json({ error: "X-API-Key header required" });
  const valid = await storage.validateApiKey(key);
  if (!valid) return res.status(401).json({ error: "Invalid API key" });
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ── GET all URLs ────────────────────────────────────────────────
  app.get("/api/urls", async (_req, res) => {
    const all = await storage.getAllUrls();
    res.json(all.map(u => ({
      id: u.id,
      shortCode: u.shortCode,
      destination: u.destination,
      title: u.title,
      clicks: u.clicks,
      hasPassword: !!u.password,
      expiresAt: u.expiresAt ?? null,
      created: formatDate(u.createdAt),
      createdAt: u.createdAt,
    })));
  });

  // ── POST create URL ─────────────────────────────────────────────
  app.post("/api/urls", async (req, res) => {
    const result = insertUrlSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten().fieldErrors });

    const { destination, shortCode: slug, title, password, expiresAt } = result.data;
    const shortCode = slug || generateShortCode();

    const existing = await storage.getUrlByShortCode(shortCode);
    if (existing) return res.status(409).json({ error: { shortCode: ["That slug is already taken"] } });

    let passwordHash: string | undefined;
    if (password) passwordHash = await bcrypt.hash(password, 10);

    const url = await storage.createUrl({ destination, shortCode, title: title ?? undefined, passwordHash, expiresAt: expiresAt ?? undefined });
    res.status(201).json({
      id: url.id, shortCode: url.shortCode, destination: url.destination,
      title: url.title, clicks: 0, hasPassword: !!url.password,
      expiresAt: url.expiresAt, created: formatDate(url.createdAt),
    });
  });

  // ── DELETE URL ──────────────────────────────────────────────────
  app.delete("/api/urls/:id", async (req, res) => {
    await storage.deleteUrl(req.params.id);
    res.status(204).end();
  });

  // ── POST bulk import (CSV) ──────────────────────────────────────
  app.post("/api/urls/bulk", async (req, res) => {
    const { csv } = req.body as { csv: string };
    if (!csv) return res.status(400).json({ error: "csv field is required" });

    let rows: any[];
    try {
      rows = csvParse(csv, { columns: true, skip_empty_lines: true, trim: true });
    } catch (e: any) {
      return res.status(400).json({ error: "Invalid CSV: " + e.message });
    }

    const results: { shortCode: string; destination: string; status: string }[] = [];

    for (const row of rows) {
      const destination = row.destination || row.url || row.URL || row.link;
      const requestedSlug = row.shortCode || row.slug || row.alias || "";

      if (!destination) { results.push({ shortCode: "", destination: "", status: "skipped (no URL)" }); continue; }

      try {
        new URL(destination); // validate
      } catch {
        results.push({ shortCode: "", destination, status: "invalid URL" }); continue;
      }

      const shortCode = requestedSlug || generateShortCode();
      const exists = await storage.getUrlByShortCode(shortCode);
      if (exists) { results.push({ shortCode, destination, status: "slug taken" }); continue; }

      const url = await storage.createUrl({ destination, shortCode });
      results.push({ shortCode: url.shortCode, destination: url.destination, status: "created" });
    }

    res.json({ count: results.length, results });
  });

  // ── Analytics summary ───────────────────────────────────────────
  app.get("/api/analytics/summary", async (_req, res) => {
    const all = await storage.getAllUrls();
    const totalClicks = all.reduce((s, u) => s + u.clicks, 0);
    const clicksToday = await storage.getTodayClicksCount();
    res.json({ totalUrls: all.length, totalClicks, clicksToday });
  });

  // ── Per-URL analytics (chart + referrers) ──────────────────────
  app.get("/api/urls/:id/analytics", async (req, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const clickList = await storage.getClicksByUrlIdSince(req.params.id, since);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const count = clickList.filter(c => c.clickedAt >= d && c.clickedAt < next).length;
      chartData.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), clicks: count });
    }

    const allClicks = await storage.getClicksByUrlId(req.params.id);
    const refMap: Record<string, number> = {};
    for (const c of allClicks) {
      let src = "Direct";
      try { if (c.referrer) src = new URL(c.referrer).hostname; } catch {}
      refMap[src] = (refMap[src] || 0) + 1;
    }
    const referrers = Object.entries(refMap)
      .map(([source, count]) => ({ source, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks).slice(0, 5);

    res.json({ chartData, referrers });
  });

  // ── Per-URL geography (click map) ────────────────────────────────
  app.get("/api/urls/:id/geography", async (req, res) => {
    const data = await storage.getClicksByUrlIdForMap(req.params.id);
    res.json(data);
  });

  // ── API Keys ────────────────────────────────────────────────────
  app.get("/api/keys", async (_req, res) => {
    const keys = await storage.listApiKeys();
    res.json(keys);
  });

  app.post("/api/keys", async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    const { key, plaintext } = await storage.createApiKey(name.trim());
    res.status(201).json({
      id: key.id, name: key.name, keyPrefix: key.keyPrefix,
      createdAt: key.createdAt,
      plaintextKey: plaintext, // only returned once
    });
  });

  app.delete("/api/keys/:id", async (req, res) => {
    await storage.deleteApiKey(req.params.id);
    res.status(204).end();
  });

  // ── External API (key-authenticated) ────────────────────────────
  app.post("/api/v1/urls", requireApiKey, async (req, res) => {
    const result = insertUrlSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten().fieldErrors });
    const { destination, shortCode: slug } = result.data;
    const shortCode = slug || generateShortCode();
    const existing = await storage.getUrlByShortCode(shortCode);
    if (existing) return res.status(409).json({ error: "Slug already taken" });
    const url = await storage.createUrl({ destination, shortCode });
    res.status(201).json({ shortCode: url.shortCode, shortUrl: `${req.protocol}://${req.get("host")}/${url.shortCode}`, destination: url.destination });
  });

  app.get("/api/v1/urls", requireApiKey, async (_req, res) => {
    const all = await storage.getAllUrls();
    res.json(all.map(u => ({ id: u.id, shortCode: u.shortCode, destination: u.destination, clicks: u.clicks })));
  });

  // ── Password-check for protected URLs ───────────────────────────
  app.post("/api/urls/:shortCode/unlock", async (req, res) => {
    const { password } = req.body;
    const url = await storage.getUrlByShortCode(req.params.shortCode);
    if (!url) return res.status(404).json({ error: "Not found" });
    if (!url.password) return res.json({ ok: true, destination: url.destination });
    const match = await bcrypt.compare(password || "", url.password);
    if (!match) return res.status(401).json({ error: "Wrong password" });
    res.json({ ok: true, destination: url.destination });
  });

  // ── Short URL redirect ───────────────────────────────────────────
  app.get("/:shortCode([a-z0-9][a-z0-9-]{1,49})", async (req, res) => {
    const url = await storage.getUrlByShortCode(req.params.shortCode);
    if (!url) return res.redirect(`/?notFound=${req.params.shortCode}`);

    // Expiry check
    if (url.expiresAt && new Date() > url.expiresAt) {
      return res.redirect(`/?expired=${req.params.shortCode}`);
    }

    // Password protection — redirect to unlock page
    if (url.password) {
      return res.redirect(`/unlock/${req.params.shortCode}`);
    }

    const ip = getClientIp(req);
    const { country, city } = lookupGeo(ip);

    await storage.incrementClicks(url.id);
    await storage.recordClick({
      urlId: url.id,
      referrer: req.headers.referer || null,
      userAgent: req.headers["user-agent"] || null,
      ip: ip || null,
      country,
      city,
    });

    res.redirect(301, url.destination);
  });

  const httpServer = createServer(app);
  return httpServer;
}
