# LinkShort - URL Shortener with Analytics & QR Codes

## Overview

LinkShort is a full-stack URL shortening web application that allows users to create short URLs with optional custom slugs, generate QR codes, and track click analytics. The app provides a dashboard with aggregate stats (total URLs, total clicks, clicks today), a searchable URL table, per-URL analytics with click history charts and referrer breakdowns, and QR code generation/download.

**Key Features:**
- Create short URLs with auto-generated or custom slugs
- QR code generation and PNG download for each short URL
- Click tracking with referrer and user agent capture
- Analytics dashboard with time-series charts (Recharts)
- Light/dark theme toggle with localStorage persistence
- Short URL redirect handling via Express routes

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend Architecture

- **Framework:** React 18 with TypeScript, bootstrapped via Vite
- **Routing:** Wouter (lightweight client-side router). Only two routes: `/` (Dashboard) and a catch-all 404.
- **State & Data Fetching:** TanStack React Query v5 for all server state. API calls go through a centralized `apiRequest` helper in `client/src/lib/queryClient.ts`. Query keys map directly to API paths (e.g., `["/api/urls"]`).
- **UI Components:** shadcn/ui (New York style) built on Radix UI primitives. All components live in `client/src/components/ui/`. Custom app components (Header, CreateUrlCard, UrlTable, UrlDetailPanel, AnalyticsCards, QrCodeDisplay, EmptyState) live in `client/src/components/`.
- **Styling:** Tailwind CSS with CSS custom properties for theming. Both light and dark modes defined in `client/src/index.css` via `:root` and `.dark` selectors.
- **Charts:** Recharts (LineChart) for click history visualization inside `UrlDetailPanel`.
- **QR Codes:** `qrcode.react` (QRCodeSVG) with client-side SVG→PNG download.
- **Forms:** Controlled React state in `CreateUrlCard` (not react-hook-form in the current UI component, though `@hookform/resolvers` is installed for future use).
- **Theme:** Custom `ThemeProvider` context with localStorage persistence. Supports `"light"` | `"dark"` only.
- **Font:** Inter (and several others) loaded from Google Fonts in `client/index.html`.

### Backend Architecture

- **Runtime:** Node.js with Express, written in TypeScript, run via `tsx` in development.
- **Entry point:** `server/index.ts` → registers routes → sets up Vite middleware (dev) or static file serving (prod).
- **Routes:** Defined in `server/routes.ts`. Key API endpoints:
  - `GET /api/urls` — list all URLs
  - `POST /api/urls` — create a short URL (validates with Zod schema from `shared/schema.ts`)
  - `DELETE /api/urls/:id` — delete a URL
  - `GET /:shortCode` — redirect to destination and record click
  - `GET /api/analytics/summary` — aggregate stats (totalUrls, totalClicks, clicksToday)
  - `GET /api/urls/:id/analytics` — per-URL click chart data and referrers
- **Storage abstraction:** `IStorage` interface in `server/storage.ts` with a `MemStorage` in-memory implementation. The app currently defaults to `MemStorage`; a PostgreSQL-backed implementation using Drizzle ORM can be swapped in via the same interface.
- **Validation:** Zod schemas from `shared/schema.ts` used on both client and server (shared via `@shared/*` path alias).
- **Short code generation:** Random 6-character base-36 string; uniqueness checked before creation.
- **Dev server:** Vite runs in middleware mode inside Express for HMR.

### Data Storage

- **Current default:** In-memory (`MemStorage`) — data is lost on restart.
- **Intended production storage:** PostgreSQL via Neon serverless (`@neondatabase/serverless`) + Drizzle ORM.
- **Schema** (`shared/schema.ts`):
  - `urls` table: `id` (varchar PK), `short_code` (text, unique), `destination` (text), `clicks` (integer, default 0), `created_at` (timestamp)
  - `clicks` table: `id` (varchar PK), `url_id` (varchar FK), `clicked_at` (timestamp), `referrer` (text), `user_agent` (text), `ip` (text)
  - `users` table: legacy, kept for compatibility — `id`, `username`, `password`
- **Migrations:** Drizzle Kit configured in `drizzle.config.ts`, outputs to `./migrations/`. Run with `npm run db:push`.
- **Session storage:** `connect-pg-simple` is installed (for PostgreSQL-backed sessions), but sessions are not currently wired up (no auth in the current codebase).

### Authentication

No authentication is implemented in the current codebase. The `users` table and `InsertUser`/`User` types exist as legacy stubs. Session middleware packages are installed but not configured.

### Build & Deployment

- **Dev:** `npm run dev` runs `tsx server/index.ts` with Vite middleware
- **Build:** `vite build` for client → `dist/public/`; `esbuild` bundles server → `dist/index.js`
- **Start:** `node dist/index.js` serves the built client as static files

---

## External Dependencies

### UI & Component Libraries
- **shadcn/ui** — Component system (New York style) built on Radix UI
- **Radix UI** — Headless accessible primitives (full suite installed)
- **Lucide React** — Icon library
- **Tailwind CSS** — Utility-first CSS framework
- **class-variance-authority + clsx + tailwind-merge** — Variant styling utilities
- **Recharts** — Chart library for click analytics
- **qrcode.react** — QR code SVG generation
- **vaul** — Drawer component
- **embla-carousel-react** — Carousel (installed, not actively used in current views)
- **cmdk** — Command palette (installed, not actively used in current views)
- **react-day-picker** — Calendar picker (installed, not actively used in current views)
- **react-resizable-panels** — Resizable panel layout (installed)

### Data & State
- **@tanstack/react-query** — Server state management
- **drizzle-orm** — TypeScript ORM for PostgreSQL
- **drizzle-zod** — Auto-generate Zod schemas from Drizzle tables
- **zod** — Schema validation (shared between client and server)
- **@hookform/resolvers** — Form validation adapter (installed)
- **react-hook-form** — Form library (installed, not wired in current UI)
- **date-fns** — Date formatting utilities

### Backend & Database
- **@neondatabase/serverless** — Neon PostgreSQL serverless driver
- **connect-pg-simple** — PostgreSQL session store for Express
- **nanoid** — ID generation (used in server/vite.ts)

### Build & Dev Tools
- **Vite** — Frontend build tool and dev server
- **@vitejs/plugin-react** — React plugin for Vite
- **@replit/vite-plugin-runtime-error-modal** — Dev error overlay
- **@replit/vite-plugin-cartographer** — Replit-specific dev plugin
- **@replit/vite-plugin-dev-banner** — Replit dev banner
- **esbuild** — Server bundle compilation
- **tsx** — TypeScript execution for Node.js (dev server)
- **drizzle-kit** — Drizzle migration and schema push CLI

### Fonts
- **Google Fonts** — Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter (loaded via `<link>` in `index.html`)