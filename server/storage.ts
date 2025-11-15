import {
  type User,
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type Link,
  type InsertLink,
  type ClickEvent,
  type InsertClickEvent,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  getWorkspacesByOwnerId(ownerId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;

  // Links
  getLink(id: string): Promise<Link | undefined>;
  getLinkByShortCode(shortCode: string, workspaceId: string): Promise<Link | undefined>;
  getLinksByWorkspaceId(workspaceId: string): Promise<Link[]>;
  createLink(link: InsertLink): Promise<Link>;
  updateLink(id: string, updates: Partial<Link>): Promise<Link | undefined>;
  deleteLink(id: string): Promise<boolean>;
  incrementLinkClicks(id: string): Promise<void>;

  // Click Events
  createClickEvent(event: InsertClickEvent): Promise<ClickEvent>;
  getClickEventsByLinkId(linkId: string): Promise<ClickEvent[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspaces: Map<string, Workspace>;
  private links: Map<string, Link>;
  private clickEvents: Map<string, ClickEvent>;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.links = new Map();
    this.clickEvents = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Workspaces
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    return Array.from(this.workspaces.values()).find(
      (workspace) => workspace.slug === slug,
    );
  }

  async getWorkspacesByOwnerId(ownerId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values()).filter(
      (workspace) => workspace.ownerId === ownerId,
    );
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const id = randomUUID();
    const workspace: Workspace = {
      id,
      name: insertWorkspace.name,
      slug: insertWorkspace.slug,
      customDomain: insertWorkspace.customDomain ?? null,
      tier: insertWorkspace.tier ?? "free",
      ownerId: insertWorkspace.ownerId,
      createdAt: new Date(),
    };
    this.workspaces.set(id, workspace);
    return workspace;
  }

  // Links
  async getLink(id: string): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async getLinkByShortCode(shortCode: string, workspaceId: string): Promise<Link | undefined> {
    return Array.from(this.links.values()).find(
      (link) => link.shortCode === shortCode && link.workspaceId === workspaceId,
    );
  }

  async getLinksByWorkspaceId(workspaceId: string): Promise<Link[]> {
    return Array.from(this.links.values())
      .filter((link) => link.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    const id = randomUUID();
    const now = new Date();
    const link: Link = {
      id,
      shortCode: insertLink.shortCode,
      originalUrl: insertLink.originalUrl,
      workspaceId: insertLink.workspaceId,
      createdById: insertLink.createdById,
      password: insertLink.password ?? null,
      expiresAt: insertLink.expiresAt ?? null,
      folder: insertLink.folder ?? null,
      title: insertLink.title ?? null,
      description: insertLink.description ?? null,
      qrCodeEnabled: insertLink.qrCodeEnabled ?? true,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.links.set(id, link);
    return link;
  }

  async updateLink(id: string, updates: Partial<Link>): Promise<Link | undefined> {
    const link = this.links.get(id);
    if (!link) return undefined;

    const updatedLink: Link = {
      ...link,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.links.set(id, updatedLink);
    return updatedLink;
  }

  async deleteLink(id: string): Promise<boolean> {
    return this.links.delete(id);
  }

  async incrementLinkClicks(id: string): Promise<void> {
    const link = this.links.get(id);
    if (link) {
      link.clicks += 1;
      this.links.set(id, link);
    }
  }

  // Click Events
  async createClickEvent(insertEvent: InsertClickEvent): Promise<ClickEvent> {
    const id = randomUUID();
    const event: ClickEvent = {
      id,
      linkId: insertEvent.linkId,
      timestamp: new Date(),
      country: insertEvent.country ?? null,
      city: insertEvent.city ?? null,
      device: insertEvent.device ?? null,
      browser: insertEvent.browser ?? null,
      os: insertEvent.os ?? null,
      referrer: insertEvent.referrer ?? null,
      ipAddress: insertEvent.ipAddress ?? null,
      userAgent: insertEvent.userAgent ?? null,
    };
    this.clickEvents.set(id, event);
    return event;
  }

  async getClickEventsByLinkId(linkId: string): Promise<ClickEvent[]> {
    return Array.from(this.clickEvents.values())
      .filter((event) => event.linkId === linkId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
