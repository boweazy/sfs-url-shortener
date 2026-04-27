# LinkShort — URL Shortener & Analytics

## Overview
A full-stack URL shortener with custom slugs, click tracking, QR code generation, geographic analytics, API key access, bulk CSV import, link expiration, and password protection. Built with the SmartFlow Systems (SFS) brand design system.

## Architecture

### Stack
- **Frontend:** React + Vite, TanStack Query, Shadcn UI, Recharts, qrcode.react, react-simple-maps
- **Backend:** Express.js (TypeScript), Drizzle ORM, node-postgres
- **Storage:** PostgreSQL (persistent via DATABASE_URL)
- **Styling:** SFS dark gold theme (#0D0D0D background, #FFD700 accents), Tailwind CSS, always-dark mode

### Key Files
- `shared/schema.ts` — Zod/Drizzle schemas: `urls`, `clicks`, `apiKeys`, `users`
- `server/db.ts` — Drizzle + node-postgres pool connection
- `server/storage.ts` — `DbStorage` class (PostgreSQL-backed)
- `server/routes.ts` — All REST API endpoints + redirect handler
- `client/src/pages/Dashboard.tsx` — Main dashboard with 3 tabs (URLs, API Keys, Custom Domain)
- `client/src/pages/Unlock.tsx` — Password unlock page for protected links
- `client/src/components/` — All UI components

## API Endpoints

### URL Management
- `GET /api/urls` — List all URLs (includes hasPassword, expiresAt, title)
- `POST /api/urls` — Create URL `{ destination, shortCode?, title?, password?, expiresAt? }`
- `DELETE /api/urls/:id` — Delete a URL + its click history
- `POST /api/urls/bulk` — Bulk CSV import `{ csv: string }` (columns: destination, shortCode)
- `POST /api/urls/:shortCode/unlock` — Password check `{ password }` → `{ ok, destination }`

### Analytics
- `GET /api/analytics/summary` — `{ totalUrls, totalClicks, clicksToday }`
- `GET /api/urls/:id/analytics` — 7-day click chart + referrer breakdown
- `GET /api/urls/:id/geography` — Country-level click counts for world map

### API Keys (authenticated)
- `GET /api/keys` — List API keys (no hash exposed)
- `POST /api/keys` — Create key `{ name }` → returns `plaintextKey` (shown once)
- `DELETE /api/keys/:id` — Revoke key
- `POST /api/v1/urls` — Create URL via API key (X-API-Key header)
- `GET /api/v1/urls` — List URLs via API key

### Redirect
- `GET /:shortCode` — Redirect; checks expiry, password, records geo (geoip-lite)

## Features
- Custom or auto-generated short slugs
- Title / label for each link
- Password protection (bcrypt hashed, unlock page at /unlock/:shortCode)
- Link expiration with datetime picker
- Bulk CSV import with per-row status
- API key generation/revocation with authenticated REST endpoints
- Click analytics: 7-day chart, referrer breakdown, world map (react-simple-maps)
- QR code generation (qrcode.react)
- Geographic click tracking via geoip-lite (records country/city from IP)
- Custom domain setup guide (informational, step-by-step)
- SFS always-dark gold theme

## Database Schema
- `urls`: id, shortCode, destination, title, clicks, password (hash), expiresAt, createdAt
- `clicks`: id, urlId, clickedAt, referrer, userAgent, ip, country, city
- `api_keys`: id, name, keyPrefix (display), keyHash (bcrypt), createdAt
- `users`: id, username, password (legacy)
