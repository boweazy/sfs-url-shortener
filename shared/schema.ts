import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── URLs ──────────────────────────────────────────────────────────
export const urls = pgTable("urls", {
  id: varchar("id", { length: 36 }).primaryKey(),
  shortCode: text("short_code").notNull().unique(),
  destination: text("destination").notNull(),
  title: text("title"),
  clicks: integer("clicks").notNull().default(0),
  password: text("password"),           // bcrypt hash, optional
  expiresAt: timestamp("expires_at"),   // optional expiry
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUrlSchema = createInsertSchema(urls).omit({
  id: true, clicks: true, createdAt: true,
}).extend({
  shortCode: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens").optional(),
  destination: z.string().url("Must be a valid URL"),
  title: z.string().max(100).optional(),
  password: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional().or(z.date().optional()).nullable(),
});

export type InsertUrl = z.infer<typeof insertUrlSchema>;
export type Url = typeof urls.$inferSelect;

// ── Clicks ────────────────────────────────────────────────────────
export const clicks = pgTable("clicks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  urlId: varchar("url_id", { length: 36 }).notNull(),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  country: text("country"),
  city: text("city"),
});

export const insertClickSchema = createInsertSchema(clicks).omit({ id: true, clickedAt: true });
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;

// ── API Keys ──────────────────────────────────────────────────────
export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),   // first 8 chars for display
  keyHash: text("key_hash").notNull(),        // bcrypt hash of full key
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, keyHash: true, keyPrefix: true, createdAt: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// ── Legacy users (kept for compat) ────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
