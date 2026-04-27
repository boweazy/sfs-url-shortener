import { db } from "./db";
import { urls, clicks, apiKeys, users } from "@shared/schema";
import type { Url, InsertUrl, Click, InsertClick, ApiKey, InsertApiKey, User, InsertUser } from "@shared/schema";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // URLs
  createUrl(data: InsertUrl & { shortCode: string; passwordHash?: string }): Promise<Url>;
  getUrlByShortCode(shortCode: string): Promise<Url | undefined>;
  getUrlById(id: string): Promise<Url | undefined>;
  getAllUrls(): Promise<Url[]>;
  deleteUrl(id: string): Promise<void>;
  incrementClicks(id: string): Promise<void>;

  // Clicks
  recordClick(data: InsertClick): Promise<Click>;
  getClicksByUrlId(urlId: string): Promise<Click[]>;
  getClicksByUrlIdSince(urlId: string, since: Date): Promise<Click[]>;
  getClicksByUrlIdForMap(urlId: string): Promise<{ country: string; count: number }[]>;
  getTodayClicksCount(): Promise<number>;
  getTotalClicksCount(): Promise<number>;

  // API Keys
  createApiKey(name: string): Promise<{ key: ApiKey; plaintext: string }>;
  listApiKeys(): Promise<Omit<ApiKey, "keyHash">[]>;
  deleteApiKey(id: string): Promise<void>;
  validateApiKey(plaintext: string): Promise<boolean>;

  // Users (legacy)
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DbStorage implements IStorage {
  // ── URLs ────────────────────────────────────────────────────────
  async createUrl(data: InsertUrl & { shortCode: string; passwordHash?: string }): Promise<Url> {
    const id = randomUUID();
    const [url] = await db.insert(urls).values({
      id,
      shortCode: data.shortCode,
      destination: data.destination,
      title: data.title ?? null,
      password: data.passwordHash ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt as any) : null,
      clicks: 0,
    }).returning();
    return url;
  }

  async getUrlByShortCode(shortCode: string): Promise<Url | undefined> {
    const [url] = await db.select().from(urls).where(eq(urls.shortCode, shortCode));
    return url;
  }

  async getUrlById(id: string): Promise<Url | undefined> {
    const [url] = await db.select().from(urls).where(eq(urls.id, id));
    return url;
  }

  async getAllUrls(): Promise<Url[]> {
    return db.select().from(urls).orderBy(desc(urls.createdAt));
  }

  async deleteUrl(id: string): Promise<void> {
    await db.delete(clicks).where(eq(clicks.urlId, id));
    await db.delete(urls).where(eq(urls.id, id));
  }

  async incrementClicks(id: string): Promise<void> {
    await db.update(urls).set({ clicks: sql`${urls.clicks} + 1` }).where(eq(urls.id, id));
  }

  // ── Clicks ──────────────────────────────────────────────────────
  async recordClick(data: InsertClick): Promise<Click> {
    const id = randomUUID();
    const [click] = await db.insert(clicks).values({ id, ...data }).returning();
    return click;
  }

  async getClicksByUrlId(urlId: string): Promise<Click[]> {
    return db.select().from(clicks).where(eq(clicks.urlId, urlId)).orderBy(clicks.clickedAt);
  }

  async getClicksByUrlIdSince(urlId: string, since: Date): Promise<Click[]> {
    return db.select().from(clicks).where(
      and(eq(clicks.urlId, urlId), gte(clicks.clickedAt, since))
    ).orderBy(clicks.clickedAt);
  }

  async getClicksByUrlIdForMap(urlId: string): Promise<{ country: string; count: number }[]> {
    const rows = await db
      .select({ country: clicks.country, count: sql<number>`count(*)::int` })
      .from(clicks)
      .where(and(eq(clicks.urlId, urlId), sql`${clicks.country} IS NOT NULL`))
      .groupBy(clicks.country);
    return rows.map(r => ({ country: r.country!, count: r.count }));
  }

  async getTodayClicksCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [row] = await db.select({ count: sql<number>`count(*)::int` })
      .from(clicks).where(gte(clicks.clickedAt, today));
    return row?.count ?? 0;
  }

  async getTotalClicksCount(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(clicks);
    return row?.count ?? 0;
  }

  // ── API Keys ────────────────────────────────────────────────────
  async createApiKey(name: string): Promise<{ key: ApiKey; plaintext: string }> {
    const id = randomUUID();
    const plaintext = `lsk_${randomUUID().replace(/-/g, "")}`;
    const keyHash = await bcrypt.hash(plaintext, 10);
    const keyPrefix = plaintext.slice(0, 12);
    const [key] = await db.insert(apiKeys).values({ id, name, keyPrefix, keyHash }).returning();
    return { key, plaintext };
  }

  async listApiKeys(): Promise<Omit<ApiKey, "keyHash">[]> {
    const rows = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
    return rows;
  }

  async deleteApiKey(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async validateApiKey(plaintext: string): Promise<boolean> {
    const rows = await db.select().from(apiKeys);
    for (const row of rows) {
      if (await bcrypt.compare(plaintext, row.keyHash)) return true;
    }
    return false;
  }

  // ── Users (legacy) ──────────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ id, ...data }).returning();
    return user;
  }
}

export const storage = new DbStorage();
