# LinkShort — URL Shortener & Analytics

## Overview
A full-stack URL shortener with custom slugs, click tracking, QR code generation, and analytics. Built with Express + React.

## Architecture

### Stack
- **Frontend:** React + Vite, TanStack Query, Shadcn UI, Recharts, qrcode.react
- **Backend:** Express.js (TypeScript)
- **Storage:** In-memory (MemStorage) — data resets on server restart
- **Styling:** Tailwind CSS with Inter font, dark mode support

### Key Files
- `shared/schema.ts` — Zod schemas and types for `Url` and `Click`
- `server/storage.ts` — In-memory storage with URL and click tracking
- `server/routes.ts` — REST API endpoints + short URL redirect
- `client/src/pages/Dashboard.tsx` — Main app page
- `client/src/components/` — All UI components

## API Endpoints
- `GET /api/urls` — List all URLs
- `POST /api/urls` — Create a short URL `{ destination, shortCode? }`
- `DELETE /api/urls/:id` — Delete a URL
- `GET /api/analytics/summary` — `{ totalUrls, totalClicks, clicksToday }`
- `GET /api/urls/:id/analytics` — Click chart data + referrer breakdown
- `GET /:shortCode` — Redirect to destination (regex-constrained to valid slugs only)

## Features
- Custom or auto-generated short slugs
- QR code generation with PNG download
- Click analytics with 7-day chart
- Referrer tracking
- Dark mode toggle
- Responsive layout

## Running
```
npm run dev    # development
npm run build  # production build
npm run start  # production server
```
