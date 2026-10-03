# Prince Net — Base44 Development Notes

## Architecture

pnpm monorepo (Node 22, pnpm 11):
- `apps/api` — NestJS API (Prisma + PostgreSQL), runs on internal port 3001
- `apps/web` — Vite + React SPA, runs on port 5173 (mapped to host port 3000)
- `packages/{types,validation,config}` — shared TypeScript packages (CJS, built to `dist/`)

**Single-origin wiring:** Vite proxies `/api` → `http://api:3001` (set via `API_PROXY_TARGET`).
The web app uses a relative `/api/v1` base URL, so all API calls go through the Vite proxy.

## Compose Services (`docker-compose.base44.yml`)

- `db` — PostgreSQL 16
- `migrate` — one-shot: builds packages, generates Prisma client, applies migrations, seeds. Must complete before API starts.
- `api` — NestJS dev (`nest start --watch`), depends on `migrate` completing
- `web` — Vite dev, depends on `api` being healthy

## Key Setup Details

- **Shared packages must be built** (`pnpm build:packages`) before the API or seed can use them — they're CJS packages consumed via `workspace:*` symlinks.
- **Prisma client must be generated** (`pnpm prisma:generate`) on each startup — the generated client lives in `apps/api/src/generated/prisma` which is on the bind mount.
- The `migrate` service runs `pnpm build:packages && pnpm prisma:generate && pnpm prisma:deploy && pnpm prisma:seed` — this ordering is required (seed imports from built packages + generated Prisma client).
- `apps/api/.env` exists locally (gitignored) but Docker env vars take precedence (dotenv doesn't override `process.env`).
- `CORS_ORIGIN` must be a valid URL (Zod validation in `apps/api/src/config/env.validation.ts`).

## Auth Flow

- JWT in HttpOnly cookies + CSRF double-submit cookie (`csrf-csrf` package).
- Web app fetches CSRF token from `GET /api/v1/auth/csrf` before mutations.
- Admin login: `admin@prince-net.local` + `ADMIN_PASSWORD` (generated dev secret, see dashboard).

## Secrets (in `/run/base44/app.env`)

- `JWT_SECRET` — min 32 chars (generated dev placeholder)
- `CSRF_SECRET` — min 16 chars (generated dev placeholder)
- `ADMIN_PASSWORD` — min 12 chars (generated dev placeholder; replace with real value for functional login)

## Verification

- Web: `curl -sf http://localhost:3000` returns Vite-served HTML
- API health: `curl -sf http://localhost:3000/api/v1/health` → `{"status":"ok","database":"ok"}`
- CSRF: `curl -sf http://localhost:3000/api/v1/auth/csrf` returns a token
