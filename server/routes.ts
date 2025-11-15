import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { customAlphabet } from "nanoid";
import { z } from "zod";

// Generate URL-safe random IDs for short codes
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 8);

// Validation schemas
const createLinkSchema = z.object({
  url: z.string().url("Invalid URL format"),
  customSlug: z.string().min(1).optional(),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  folder: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  qrCodeEnabled: z.boolean().optional(),
});

// Helper function to extract device type from user agent
function getDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet/i.test(userAgent)) return "tablet";
  return "desktop";
}

// Helper function to extract browser from user agent
function getBrowser(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Other";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize demo workspace for development
  const demoUser = await storage.createUser({
    username: "demo",
    password: "demo123",
  });

  const demoWorkspace = await storage.createWorkspace({
    name: "Demo Workspace",
    slug: "demo",
    customDomain: null,
    tier: "free",
    ownerId: demoUser.id,
  });

  // API Routes
  // -----------------

  // GET /api/links - Get all links for a workspace
  app.get("/api/links", async (req: Request, res: Response) => {
    try {
      const workspaceId = (req.query.workspaceId as string) || demoWorkspace.id;
      const links = await storage.getLinksByWorkspaceId(workspaceId);

      res.json({
        links: links.map((link) => ({
          id: link.id,
          shortCode: link.shortCode,
          destination: link.originalUrl,
          clicks: link.clicks,
          created: link.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          qrCodeEnabled: link.qrCodeEnabled,
          folder: link.folder,
          title: link.title,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  // POST /api/links - Create a new short link
  app.post("/api/links", async (req: Request, res: Response) => {
    try {
      const validatedData = createLinkSchema.parse(req.body);
      const workspaceId = demoWorkspace.id; // For now, use demo workspace

      // Generate short code
      let shortCode = validatedData.customSlug || nanoid(6);

      // Check if short code already exists in this workspace
      const existingLink = await storage.getLinkByShortCode(shortCode, workspaceId);
      if (existingLink) {
        if (validatedData.customSlug) {
          return res.status(409).json({ message: "This custom slug is already taken" });
        }
        // If auto-generated, try again
        shortCode = nanoid(8);
      }

      // Create the link
      const link = await storage.createLink({
        shortCode,
        originalUrl: validatedData.url,
        workspaceId,
        createdById: demoUser.id,
        password: validatedData.password || null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        folder: validatedData.folder || null,
        title: validatedData.title || null,
        description: validatedData.description || null,
        qrCodeEnabled: validatedData.qrCodeEnabled ?? true,
      });

      res.status(201).json({
        link: {
          id: link.id,
          shortCode: link.shortCode,
          shortUrl: `${req.protocol}://${req.get("host")}/${link.shortCode}`,
          destination: link.originalUrl,
          clicks: link.clicks,
          created: link.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          qrCodeEnabled: link.qrCodeEnabled,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create link" });
    }
  });

  // DELETE /api/links/:id - Delete a link
  app.delete("/api/links/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLink(id);

      if (!deleted) {
        return res.status(404).json({ message: "Link not found" });
      }

      res.json({ message: "Link deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete link" });
    }
  });

  // GET /api/links/:id/analytics - Get analytics for a specific link
  app.get("/api/links/:id/analytics", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const link = await storage.getLink(id);

      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      const clickEvents = await storage.getClickEventsByLinkId(id);

      // Aggregate analytics
      const referrerCounts: Record<string, number> = {};
      const countryCounts: Record<string, number> = {};
      const deviceCounts: Record<string, number> = {};

      clickEvents.forEach((event) => {
        const referrer = event.referrer || "Direct";
        referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;

        if (event.country) {
          countryCounts[event.country] = (countryCounts[event.country] || 0) + 1;
        }

        if (event.device) {
          deviceCounts[event.device] = (deviceCounts[event.device] || 0) + 1;
        }
      });

      res.json({
        link: {
          id: link.id,
          shortCode: link.shortCode,
          destination: link.originalUrl,
          totalClicks: link.clicks,
        },
        analytics: {
          topReferrers: Object.entries(referrerCounts)
            .map(([source, clicks]) => ({ source, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10),
          topCountries: Object.entries(countryCounts)
            .map(([country, clicks]) => ({ country, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10),
          deviceBreakdown: Object.entries(deviceCounts).map(([device, clicks]) => ({
            device,
            clicks,
          })),
          recentClicks: clickEvents.slice(0, 50).map((event) => ({
            timestamp: event.timestamp,
            country: event.country,
            device: event.device,
            referrer: event.referrer,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Redirect Route - MUST be last
  // -----------------

  // GET /:shortCode - Redirect to original URL
  app.get("/:shortCode", async (req: Request, res: Response, next) => {
    try {
      const { shortCode } = req.params;

      // Skip API routes and static assets
      if (
        shortCode.startsWith("api") ||
        shortCode.includes(".") ||
        shortCode === "favicon.ico"
      ) {
        return next();
      }

      const link = await storage.getLinkByShortCode(shortCode, demoWorkspace.id);

      if (!link) {
        return next(); // Let Vite/static handler deal with it
      }

      // Check if link has expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).send("This link has expired");
      }

      // Record click event
      const userAgent = req.get("user-agent");
      await storage.createClickEvent({
        linkId: link.id,
        country: null, // Could integrate with GeoIP service
        city: null,
        device: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
        os: null,
        referrer: req.get("referer") || null,
        ipAddress: req.ip || null,
        userAgent: userAgent || null,
      });

      // Increment click count
      await storage.incrementLinkClicks(link.id);

      // Redirect
      res.redirect(301, link.originalUrl);
    } catch (error) {
      next();
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
