# Prince Net — Architecture

> **Implementation status:** Code and documentation complete. Operational testing and production deployment pending.

---

## 1. Overview

Prince Net is an internal management system for an Internet network. It is built as a **monorepo** with a clear separation between:

- **Frontend** (`apps/web`) — React SPA
- **Backend** (`apps/api`) — NestJS REST API
- **Shared packages** (`packages/*`) — contracts, validation, config

The system is designed to run on a **single host** (Serv00 or equivalent), with a **single Admin account**, and does **not** depend on any external SaaS platform for its data or logic.

---

## 2. Technology Stack

### Frontend

- React 18
- TypeScript 5.5
- Vite 5
- React Router 6
- TanStack Query 5
- React Hook Form + Zod
- Tailwind CSS 3 + shadcn/ui + Radix UI
- Recharts
- Lucide icons

### Backend

- Node.js 20+
- TypeScript 5.5
- NestJS 10
- Prisma ORM 6
- PostgreSQL 15+
- `@node-rs/argon2` — password hashing
- `passport-jwt` — authentication
- `csrf-csrf` — CSRF protection
- `class-validator` / `class-transformer` — DTO validation
- Helmet, cookie-parser, throttler

### Database

- PostgreSQL
- 17 tables, 10 enums
- All primary keys: `UUID`
- All money: `NUMERIC(12,2)`
- All timestamps: `TIMESTAMPTZ(6)`

### Monorepo

- **pnpm workspaces** only
- **No Turborepo**
- Node 20+ required

---

## 3. Monorepo Structure

```
prince-net/
├── apps/
│   ├── api/        ← NestJS backend
│   └── web/        ← React frontend
├── packages/
│   ├── types/      ← Shared TypeScript contracts
│   ├── validation/ ← Shared Zod schemas
│   └── config/     ← Shared constants + defaults (browser-safe)
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## 4. Layered Architecture

### Frontend

```
React Component
      │
      ▼
Feature Hook (TanStack Query)
      │
      ▼
API Client (fetch + CSRF + credentials)
      │
      ▼
Backend
```

- **Server state:** TanStack Query
- **Form state:** React Hook Form + Zod
- **UI state:** local `useState` / `useReducer`
- **No Redux**, **no Zustand**, **no global state library**

### Backend

```
Controller
      │
      ▼
Service
      │
      ▼
Prisma
      │
      ▼
PostgreSQL
```

- Controllers: routing + validation + audit context
- Services: business logic + transactions
- Prisma: data access + relations
- PostgreSQL: source of truth

---

## 5. Authentication Flow

```
POST /api/v1/auth/login
      │
      ▼
Argon2 verify
      │
      ▼
JWT signed
      │
      ▼
Set-Cookie: prince_net_token (HttpOnly, SameSite, Secure)
      │
      ▼
Frontend receives 200 (no JWT in JS)
      │
      ▼
Subsequent requests: Cookie sent automatically
      │
      ▼
GET /api/v1/auth/me → validates session
```

- **JWT is never exposed to JavaScript**
- **No `localStorage`, no `sessionStorage`**
- **CSRF token is kept in memory only**

---

## 6. CSRF Protection

Double-submit cookie pattern via `csrf-csrf`:

1. `GET /api/v1/auth/csrf` — sets CSRF cookie + returns token in body
2. Frontend stores token in memory
3. Mutating requests send `X-CSRF-Token` header
4. Server validates via `csrf-csrf` middleware

- **`cookie-parser` is registered before `csrf-csrf`**
- **GET / HEAD / OPTIONS are excluded**
- **`@Public()` routes still require CSRF** (e.g. `/auth/login`)

---

## 7. Ledger-Based Data Model

The system treats **inventory** and **cash** as **ledgers**:

- Inventory current stock = `SUM(inventory_movements.quantity_delta)`
- Cash balance = `SUM(cash_movements.IN) - SUM(cash_movements.OUT)`
- Distributor balance = `SUM(ACTIVE sales.total_amount) - SUM(ACTIVE payments.amount)`

**No balances are stored in the database.**

---

## 8. Transactions

All operations that touch more than one table run inside a Prisma transaction:

- `POST /sales` — Sale + SaleItems + InventoryMovements + Payment + CashMovement + Audit
- `POST /sales/:id/cancel` — reverses payments, restores inventory, reverses cash
- `POST /payments` — Payment + CashMovement + Audit
- `POST /payments/:id/reverse` — status=REVERSED + CashMovement reversal + Audit
- `POST /inventory/add` — PackageStock + InventoryMovement + Audit
- `POST /inventory/adjust` — Serializable + `SELECT FOR UPDATE` + retry on `P2034`
- `POST /inventory/return` — InventoryMovement + Audit
- `POST /expenses` — Expense + CashMovement + Audit
- `POST /expenses/:id/reverse` — status=REVERSED + CashMovement reversal + Audit
- `POST /line-payments` — LinePayment + CashMovement + Audit
- `POST /owner-withdrawals` — OwnerWithdrawal + CashMovement + Audit
- `POST /cash/manual-in` / `manual-out` — CashMovement + Audit

---

## 9. Backup Architecture

### Creation

1. Advisory lock on PostgreSQL (prevents concurrent backup/restore)
2. `REPEATABLE READ` transaction reads all 17 tables from a single snapshot
3. Snapshot serialized to JSON + gzip **outside** the transaction
4. SHA-256 checksum + size computed
5. Row inserted into `backups` table (metadata only)
6. Audit log entry

### Restore

1. Verify checksum against stored value
2. Validate `schemaVersion` against current constant
3. `Serializable` transaction with advisory lock
4. Delete all rows (FK-safe order)
5. Insert all rows from snapshot (FK-safe order)
6. Audit log entry (after commit)

- `storagePath` is **never** returned by the API
- Backup files are stored **outside** the web root (`BACKUP_DIR`)

---

## 10. Deployment Target

- **Serv00** (shared hosting with Node.js)
- Build:
  - Frontend → `apps/web/dist/`
  - Backend → `apps/api/dist/`
- Process manager: PM2 or systemd (or Serv00-native)
- Database: PostgreSQL local to Serv00
- Cron: database backup + cleanup

---

## 11. Development

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`

---

## 12. Production

```bash
NODE_ENV=production pnpm build
pnpm prisma:deploy
NODE_ENV=production pnpm start
```

- **No `prisma migrate dev` in production**
- **No secrets in Git**
- **No external SaaS dependency**