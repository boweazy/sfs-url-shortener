import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const urls = pgTable("urls", {
  id: varchar("id").primaryKey(),
  shortCode: text("short_code").notNull().unique(),
  destination: text("destination").notNull(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clicks = pgTable("clicks", {
  id: varchar("id").primaryKey(),
  urlId: varchar("url_id").notNull(),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: text("ip"),
});

export const insertUrlSchema = createInsertSchema(urls).omit({
  id: true,
  clicks: true,
  createdAt: true,
}).extend({
  shortCode: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed").optional(),
  destination: z.string().url("Must be a valid URL"),
});

export const insertClickSchema = createInsertSchema(clicks).omit({
  id: true,
  clickedAt: true,
});

export type InsertUrl = z.infer<typeof insertUrlSchema>;
export type Url = typeof urls.$inferSelect;
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;

// Legacy user types (kept for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
