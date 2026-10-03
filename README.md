# Prince Net Management System

نظام إدارة داخلي لشبكة إنترنت — إدارة باقات، مخزون، مبيعات، موزعين، ديون، تحصيلات، خطوط، مصروفات، صندوق، تقارير، سجل عمليات، نسخ احتياطي، وإعدادات.

---

> **Implementation status:** Core implementation complete; CI, health checks, session invalidation, backup hardening, and production configuration validation are included.
>
> **Production deployment remains environment-specific and must be verified on the target host before go-live.**

---

## Overview

Prince Net is a single-Admin, ledger-based management system:

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React + Vite + TypeScript
- **Monorepo:** pnpm workspaces (no Turborepo)
- **Auth:** JWT in HttpOnly Cookie + CSRF
- **No external SaaS dependency**

---

## Stack

### Frontend

React 18 · TypeScript 5.5 · Vite 5 · React Router 6 · TanStack Query 5 · React Hook Form · Zod · Tailwind CSS 3 · shadcn/ui · Radix UI · Recharts · Lucide

### Backend

Node.js 22.12+ · TypeScript 5.5 · NestJS 10 · Prisma 6 · PostgreSQL 15+ · `@node-rs/argon2` · `passport-jwt` · `csrf-csrf` · Helmet · throttler

### Database

PostgreSQL — 17 tables, 10 enums, all money `NUMERIC(12,2)`, all PKs `UUID`

---

## Architecture

```
React (apps/web)
      │
      │ REST / JSON  +  HttpOnly Cookie  +  CSRF Header
      ▼
NestJS (apps/api)
      │
      ▼
Prisma ORM
      │
      ▼
PostgreSQL
```

See `docs/architecture.md` for the full architecture.

---

## Requirements

- Node.js ≥ 22.12
- pnpm ≥ 11.28
- PostgreSQL ≥ 15
- Git

---

## Installation

```bash
git clone <repo-url> prince-net
cd prince-net
pnpm install
```

---

## Environment Setup

```bash
cp .env.example .env
```

Edit the following values in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `CSRF_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `BACKUP_DIR` (absolute path, outside web root)

> ⚠️ Never commit secrets. `.env` is excluded via `.gitignore`.

---

## Database Setup

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

Production:

```bash
pnpm prisma:deploy
```

---

## Development

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api/v1
- Health: http://localhost:3000/api/v1/health

---

## Build

```bash
pnpm build
```

---

## Production

```bash
NODE_ENV=production pnpm build
pnpm prisma:deploy
NODE_ENV=production pnpm start
```

- Use `prisma migrate deploy`, not `prisma migrate dev`
- Serve `apps/web/dist/` via static host
- Run `apps/api/dist/` under a process manager

---

## Project Structure

```
prince-net/
├── apps/
│   ├── web/        ← React + Vite
│   └── api/        ← NestJS + Prisma
├── packages/
│   ├── types/      ← Shared TypeScript contracts
│   ├── validation/ ← Shared Zod schemas
│   └── config/     ← Shared constants + defaults
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── business-rules.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Features

### Admin & Auth

- Single Admin (no register, no roles)
- Login, logout, change password
- JWT in HttpOnly Cookie + CSRF

### Master Data

- Packages (CRUD + activate/deactivate)
- Distributors (CRUD + balance)
- Lines (CRUD)
- Expense Categories (CRUD + activate/deactivate)
- Settings (singleton)

### Inventory

- Ledger-based
- `ADD` / `SELL` / `RETURN` / `ADJUSTMENT`
- FIFO on sale
- Current stock computed from movements

### Sales

- Transaction + FIFO
- Historical price snapshots
- Optional initial payment
- Cancellation reverses payments and restores inventory

### Payments

- Overpayment prevented
- Reversal via status change
- Cash movement created automatically

### Cash

- Ledger-based
- Manual IN / OUT
- Balance computed from movements

### Expenses & Lines

- Expenses create `OUT` cash movements
- Line payments create `OUT` cash movements
- Both support reversal

### Owner Withdrawals

- Create + reverse
- Cash movement `OUT` / `IN`

### Reports

- Sales, Cash, Inventory, Distributors, Expenses, Lines
- Aggregated in Backend

### Search

- Distributors, Packages, Sales, Lines, Expenses
- 20 results max

### Audit Log

- Read-only, paginated
- Filters: action, entityType, date range

### Backup

- Creation via `REPEATABLE READ` snapshot + advisory lock
- Restore via `Serializable` transaction + advisory lock
- Files stored outside web root

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run API + Web in parallel |
| `pnpm build` | Build packages then apps |
| `pnpm start` | Run API in production |
| `pnpm lint` | Lint all workspaces |
| `pnpm typecheck` | Typecheck all workspaces |
| `pnpm test` | Run tests |
| `pnpm prisma:generate` | Generate Prisma Client |
| `pnpm prisma:migrate` | Dev migration |
| `pnpm prisma:deploy` | Production migration |
| `pnpm prisma:seed` | Seed database |

---

## Documentation

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API](docs/api.md)
- [Business Rules](docs/business-rules.md)

---

## Security

- HttpOnly Secure Cookies
- CSRF via double-submit cookie
- Argon2 password hashing
- Rate limiting (120/min global, 10/min login)
- Helmet security headers
- CORS restricted
- No secrets in Git

---

## Deployment

Target: **Serv00** or any Node.js + PostgreSQL host.

- Frontend: static build → `apps/web/dist/`
- Backend: `apps/api/dist/` under a process manager
- Database: local PostgreSQL
- Backups: absolute path via `BACKUP_DIR`
- Cron: automated backup + cleanup

---

## Known Limitations

- **Production deployment has not yet been verified on the target host**
- Bundle size warning (>500 KB) — future optimization planned
- CI runs typecheck, build, and test on every push/PR to `main`

---

## License

Internal use only.