import { type Url, type InsertUrl, type Click, type InsertClick, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // URL operations
  createUrl(data: InsertUrl & { shortCode: string }): Promise<Url>;
  getUrlByShortCode(shortCode: string): Promise<Url | undefined>;
  getAllUrls(): Promise<Url[]>;
  deleteUrl(id: string): Promise<void>;
  incrementClicks(id: string): Promise<void>;

  // Click operations
  recordClick(data: InsertClick): Promise<Click>;
  getClicksByUrlId(urlId: string): Promise<Click[]>;
  getClicksByUrlIdSince(urlId: string, since: Date): Promise<Click[]>;
  getTodayClicksCount(): Promise<number>;
  getTotalClicksCount(): Promise<number>;

  // User operations (legacy)
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private urls: Map<string, Url>;
  private clickRecords: Map<string, Click>;
  private users: Map<string, User>;

  constructor() {
    this.urls = new Map();
    this.clickRecords = new Map();
    this.users = new Map();
  }

  async createUrl(data: InsertUrl & { shortCode: string }): Promise<Url> {
    const id = randomUUID();
    const url: Url = {
      id,
      shortCode: data.shortCode,
      destination: data.destination,
      clicks: 0,
      createdAt: new Date(),
    };
    this.urls.set(id, url);
    return url;
  }

  async getUrlByShortCode(shortCode: string): Promise<Url | undefined> {
    return Array.from(this.urls.values()).find((u) => u.shortCode === shortCode);
  }

  async getAllUrls(): Promise<Url[]> {
    return Array.from(this.urls.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async deleteUrl(id: string): Promise<void> {
    this.urls.delete(id);
    // Remove associated clicks
    for (const [clickId, click] of this.clickRecords.entries()) {
      if (click.urlId === id) {
        this.clickRecords.delete(clickId);
      }
    }
  }

  async incrementClicks(id: string): Promise<void> {
    const url = this.urls.get(id);
    if (url) {
      this.urls.set(id, { ...url, clicks: url.clicks + 1 });
    }
  }

  async recordClick(data: InsertClick): Promise<Click> {
    const id = randomUUID();
    const click: Click = {
      id,
      urlId: data.urlId,
      clickedAt: new Date(),
      referrer: data.referrer ?? null,
      userAgent: data.userAgent ?? null,
      ip: data.ip ?? null,
    };
    this.clickRecords.set(id, click);
    return click;
  }

  async getClicksByUrlId(urlId: string): Promise<Click[]> {
    return Array.from(this.clickRecords.values())
      .filter((c) => c.urlId === urlId)
      .sort((a, b) => a.clickedAt.getTime() - b.clickedAt.getTime());
  }

  async getClicksByUrlIdSince(urlId: string, since: Date): Promise<Click[]> {
    return Array.from(this.clickRecords.values())
      .filter((c) => c.urlId === urlId && c.clickedAt >= since)
      .sort((a, b) => a.clickedAt.getTime() - b.clickedAt.getTime());
  }

  async getTodayClicksCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.clickRecords.values()).filter(
      (c) => c.clickedAt >= today
    ).length;
  }

  async getTotalClicksCount(): Promise<number> {
    return this.clickRecords.size;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, ...data };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
