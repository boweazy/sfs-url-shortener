import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workspaces table (for multi-tenancy)
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // e.g., "acme" for acme.sfs.link
  customDomain: text("custom_domain"), // e.g., "links.acmecorp.com"
  tier: text("tier").notNull().default("free"), // "free", "pro", "enterprise"
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Links table
export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: text("short_code").notNull(), // The slug, e.g., "promo-2025"
  originalUrl: text("original_url").notNull(),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  createdById: varchar("created_by_id").notNull().references(() => users.id),

  // Optional features
  password: text("password"), // For password-protected links
  expiresAt: timestamp("expires_at"), // Auto-delete after this date
  folder: text("folder"), // For organizing links

  // Metadata
  title: text("title"),
  description: text("description"),
  qrCodeEnabled: boolean("qr_code_enabled").default(true).notNull(),

  // Analytics
  clicks: integer("clicks").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  shortCodeIdx: index("short_code_idx").on(table.shortCode),
  workspaceIdx: index("workspace_idx").on(table.workspaceId),
  // Unique constraint: shortCode must be unique per workspace
  uniqueShortCode: index("unique_short_code_workspace").on(table.workspaceId, table.shortCode),
}));

// Click events table (for analytics)
export const clickEvents = pgTable("click_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),

  // Analytics data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  country: text("country"),
  city: text("city"),
  device: text("device"), // "desktop", "mobile", "tablet"
  browser: text("browser"),
  os: text("os"),
  referrer: text("referrer"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  linkIdx: index("click_events_link_idx").on(table.linkId),
  timestampIdx: index("click_events_timestamp_idx").on(table.timestamp),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  clicks: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClickEventSchema = createInsertSchema(clickEvents).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof links.$inferSelect;

export type InsertClickEvent = z.infer<typeof insertClickEventSchema>;
export type ClickEvent = typeof clickEvents.$inferSelect;
