# Prince Net Management System

A self-hosted management and accounting-oriented system for an Internet network business.

Prince Net manages Internet packages, inventory, distributors, sales, payments, cash movements, Internet lines, line payments, expenses, owner withdrawals, reports, audit logs, settings, and database backups.

> **Project snapshot:** `prince-net-lines-enhanced-fixed`
>
> The codebase and project documentation are included in this repository. Operational testing and production deployment should be completed before production use.

---

## Features

### Dashboard

- Sales and payment summaries
- Cash balance
- Distributor debt overview
- Low-stock alerts
- Recent transactions
- Top packages

### Packages

- Create, edit, activate, and deactivate Internet packages
- Price, data allowance, hours, color, and description
- Package prices are read from the database during sales

### Inventory

- Add stock by package
- Batch-based stock records
- Historical unit price per batch
- Inventory movements
- Manual adjustments
- Inventory returns
- Low-stock monitoring
- FIFO allocation during sales

Current inventory is calculated from the inventory ledger rather than stored as a mutable balance.

### Distributors

- Create and edit distributors
- Activate/deactivate distributors
- Distributor sales history
- Distributor payment history
- Computed outstanding balance

Distributor balance is calculated from active sales minus active payments.

### Sales

- Create sales for distributors
- Multiple package items per sale
- Automatic FIFO inventory allocation
- Historical package-name and unit-price snapshots
- Optional initial payment
- Overpayment protection
- Sale cancellation with payment reversal and inventory restoration
- Invoice numbers and sale details

### Payments

- Record payments against sales
- Prevent overpayment
- Payment history
- Payment reversal with reason
- Reversal creates the corresponding cash reversal movement

Financial records are not hard-deleted when a reversal is required.

### Cash

- Calculated cash balance
- Cash movement ledger
- Manual cash-in
- Manual cash-out
- Sale payment movements
- Expense movements
- Line payment movements
- Owner withdrawal movements
- Reversal movements

### Internet Lines

- Create and edit Internet lines
- Provider, identifier, speed, monthly cost, subscription date, and notes
- Activate/deactivate lines
- Search and status filtering
- Line details page
- Line payment ledger
- Create line payments
- Reverse line payments with a reason
- Financially safe payment lifecycle: create → active → reverse
- Payment history printing

#### Line payment printout

The line details page provides one print action for the line payment ledger. The printable report contains:

- Line name
- Identifier
- Monthly cost
- Payment date
- Period/description
- Amount
- Status
- Notes
- Total paid
- Payment count
- Print date/time

Provider and speed are intentionally excluded from the printout.

### Expenses

- Expense categories
- Create and edit expenses
- Expense dates and notes
- Expense reversal
- Cash ledger integration
- Audit logging

### Owner Withdrawals

- Record owner withdrawals
- Reason and notes
- Withdrawal date
- Reversal workflow
- Cash ledger integration
- Audit logging

### Reports

Reports are available for:

- Sales
- Inventory
- Distributors
- Expenses
- Internet lines
- Owner withdrawals

### Search

A unified search page is included for finding relevant records across the system.

### Audit Log

- Login and failed-login events
- Entity creation and updates
- Status changes
- Financial actions
- Inventory actions
- Backup actions
- Settings and password changes
- User, entity, IP, and user-agent information
- Old/new value snapshots where applicable
- Search and filtering
- Structured Arabic detail presentation instead of raw JSON-only display
- Before/after comparison when both snapshots exist
- Copy actions for IDs and raw JSON

The original audit JSON remains available for technical investigation.

### Backups

- Database backup creation
- Backup metadata stored in PostgreSQL
- Backup files stored outside the web root
- SHA-256 checksum verification
- Schema-version verification
- Restore workflow
- PostgreSQL advisory locking for backup/restore operations
- Audit trail for backup operations

---

## Technology Stack

### Frontend

- React 18
- TypeScript 5.5
- Vite 5
- React Router 6
- TanStack Query 5
- React Hook Form
- Zod
- Tailwind CSS 3
- Radix UI
- Lucide React
- Recharts

### Backend

- Node.js 22+
- TypeScript 5.5
- NestJS 10
- Prisma 6
- PostgreSQL 15+
- Passport / JWT
- Argon2 password hashing
- CSRF protection
- Helmet
- Cookie Parser
- NestJS throttler
- class-validator / class-transformer

### Monorepo

- pnpm workspaces
- No Turborepo
- Shared packages for types, validation, and configuration

---

## Architecture

```text
                        ┌─────────────────────┐
                        │     React / Vite    │
                        │      apps/web       │
                        └──────────┬──────────┘
                                   │
                         REST / JSON + Cookie
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │      NestJS API     │
                        │      apps/api       │
                        └──────────┬──────────┘
                                   │
                                Prisma
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │      PostgreSQL     │
                        └─────────────────────┘

                 Shared contracts / validation / config
                 ┌─────────────────────────────────────┐
                 │ packages/types                       │
                 │ packages/validation                  │
                 │ packages/config                      │
                 └─────────────────────────────────────┘
```

### Backend flow

```text
Controller → Service → Prisma → PostgreSQL
```

Controllers handle HTTP concerns and validation context. Services contain business rules and transactional operations. PostgreSQL is the source of truth.

### Frontend state

- TanStack Query for server state
- React Hook Form + Zod for forms
- Local React state for UI state
- No Redux
- No Zustand

---

## Authentication and Security

Authentication uses a JWT stored in an **HttpOnly cookie**.

```text
Login
  ↓
Argon2 password verification
  ↓
JWT creation
  ↓
HttpOnly authentication cookie
  ↓
Authenticated API requests
```

The JWT is not stored in `localStorage` or `sessionStorage`.

CSRF protection uses a double-submit cookie pattern:

1. Request the CSRF endpoint.
2. Receive the CSRF token.
3. Keep the token in frontend memory.
4. Send it in the `X-CSRF-Token` header for mutating requests.
5. The backend validates the token.

Additional protections include:

- Password hashing with Argon2
- Helmet security headers
- HTTP rate limiting
- Input validation with Zod/class-validator
- Transactional financial operations
- Audit logging

---

## Financial and Inventory Rules

### Money

- PostgreSQL type: `NUMERIC(12,2)`
- Backend representation: `Prisma.Decimal`
- API representation: string with two decimal places
- Frontend money values use string-based handling
- Floating-point arithmetic is avoided for money

### Inventory ledger

Current stock is calculated as:

```text
SUM(inventory_movements.quantity_delta)
```

Movement types:

- `ADD`
- `SELL`
- `RETURN`
- `ADJUSTMENT`

### FIFO

Sales allocate inventory in this order:

```text
received_at ASC
created_at ASC
id ASC
```

### Cash ledger

Cash balance is calculated as:

```text
SUM(IN movements) - SUM(OUT movements)
```

### Distributor balance

```text
SUM(ACTIVE sales.total_amount)
- SUM(ACTIVE payments.amount)
```

Balances are calculated rather than stored as mutable balance columns.

### Historical prices

Past transactions preserve their historical prices through snapshots such as:

- `sale_items.unit_price`
- `package_stocks.unit_price`
- `inventory_movements.unit_price`

Changing the current package price does not change historical transactions.

---

## Financial Immutability

Financial records use a reversal model instead of silently changing historical accounting data.

Typical lifecycle:

```text
Create
  ↓
ACTIVE
  ↓
Reverse with reason
  ↓
REVERSED
```

A reversal records who reversed the operation, when it happened, why it happened, and creates the corresponding opposite cash movement when applicable.

This pattern is used for payments, line payments, expenses, and owner withdrawals.

---

## Database

The project uses PostgreSQL with Prisma 6.

The current schema contains **17 tables** and multiple domain enums covering:

- Users
- Packages
- Package stock batches
- Inventory movements
- Distributors
- Sales
- Sale items
- Payments
- Lines
- Line payments
- Expenses
- Expense categories
- Owner withdrawals
- Cash movements
- Audit logs
- Backups
- Settings

Primary keys use UUIDs. Monetary columns use `NUMERIC(12,2)`, and timestamps use `TIMESTAMPTZ(6)`.

Prisma migrations are stored in:

```text
apps/api/prisma/migrations/
```

Current migrations include the audit-action synchronization migration:

```text
20261003072000_sync_audit_action
```

---

## Project Structure

```text
prince-net/
├── apps/
│   ├── api/                    # NestJS REST API
│   │   ├── prisma/             # Prisma schema, seed, migrations
│   │   └── src/                # API modules and business logic
│   │
│   └── web/                    # React/Vite frontend
│       └── src/features/       # Feature modules
│
├── packages/
│   ├── config/                 # Shared constants/defaults
│   ├── types/                  # Shared TypeScript contracts
│   └── validation/             # Shared Zod schemas
│
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── audit-log-improvements.md
│   ├── business-rules.md
│   └── database.md
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Requirements

The root package configuration currently specifies:

- **Node.js:** `>=22.13.0`
- **pnpm:** `>=11.28.0`
- **PostgreSQL:** `15+`

The API package also requires Node.js `>=22.12.0`.

Use the root requirements when setting up the complete monorepo.

---

## Installation

Clone the repository and enter the project directory:

```bash
git clone https://github.com/messi7775/prince2.git
cd prince2
```

Install dependencies:

```bash
pnpm install
```

Create the environment file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `CSRF_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `BACKUP_DIR`
- `CORS_ORIGIN`
- `VITE_API_BASE_URL`

Do not commit real production secrets to `.env.example`.

---

## Database Setup

Generate Prisma Client:

```bash
pnpm prisma:generate
```

Apply development migrations:

```bash
pnpm prisma:migrate
```

Seed the initial admin account, default packages, and settings:

```bash
pnpm prisma:seed
```

For an existing production database, use:

```bash
pnpm prisma:deploy
```

Prisma Studio:

```bash
pnpm prisma:studio
```

### Seeded data

The seed process creates or updates:

- The configured admin user
- The default Internet packages
- The main settings singleton

The seed reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `DATABASE_URL` from the environment.

---

## Development

Start both applications:

```bash
pnpm dev
```

Typical local endpoints:

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`

The exact host/port can be changed through the environment configuration.

---

## Build

Build shared packages and applications:

```bash
pnpm build
```

Type-check the workspace:

```bash
pnpm typecheck
```

Lint the workspace:

```bash
pnpm lint
```

Run the configured test commands:

```bash
pnpm test
```

The web package currently has no automated test suite and exits successfully with a `no tests for web` message.

---

## Production

Build:

```bash
pnpm build
```

Deploy Prisma migrations:

```bash
pnpm prisma:deploy
```

Start the compiled API:

```bash
pnpm start
```

The frontend build is generated under:

```text
apps/web/dist/
```

The backend build is generated under:

```text
apps/api/dist/
```

---

## API

The REST API uses the prefix:

```text
/api/v1
```

Main resource groups include:

```text
/auth
/packages
/inventory
/distributors
/sales
/payments
/cash
/lines
/line-payments
/expenses
/expense-categories
/owner-withdrawals
/reports
/search
/audit
/backups
/settings
```

For endpoint-level details, see:

```text
docs/api.md
```

---

## Transactions and Concurrency

Multi-table operations are executed inside Prisma transactions.

Important operations include:

- Sales and sale cancellation
- Payments and payment reversals
- Inventory additions, adjustments, and returns
- Expenses and reversals
- Line payments and reversals
- Owner withdrawals and reversals
- Manual cash movements
- Backup and restore

Concurrency protection includes:

- `Serializable` transactions where required
- `SELECT FOR UPDATE` for inventory/payment-sensitive operations
- Retry handling for Prisma `P2034` write conflicts
- PostgreSQL advisory locks for backup/restore operations

If a transactional operation fails, the transaction is rolled back.

---

## Backup and Restore

Backups are designed to be stored outside the public web root.

The backup system uses:

- PostgreSQL advisory locking
- Consistent database snapshots
- SHA-256 checksums
- Schema-version validation
- Transactional restore
- Audit logging

Configure the storage directory with:

```env
BACKUP_DIR=/absolute/path/outside/web/root
```

The backup storage path should not be publicly accessible from the web server.

---

## Documentation

Detailed project documentation is available under `docs/`:

| Document | Purpose |
|---|---|
| `docs/api.md` | REST API endpoints and response conventions |
| `docs/architecture.md` | System architecture and security flow |
| `docs/business-rules.md` | Financial, inventory, FIFO, reversal, and transaction rules |
| `docs/database.md` | Database tables, enums, and relationships |
| `docs/audit-log-improvements.md` | Audit log UI and contract improvements |

---

## Scope and Accounting Limitations

The system tracks operational and cash information, including:

- Sales
- Payments
- Expenses
- Owner withdrawals
- Cash movements
- Inventory
- Distributor balances
- Line payments

It does **not** currently calculate full accounting statements such as:

- Net profit
- COGS
- Assets
- Liabilities
- Equity

Those accounting capabilities are outside the current project scope.

The current model is designed around a **single Admin account** and does not implement a multi-user role/permission system.

---

## License

No open-source license is declared in the current project snapshot. All rights remain with the project owner unless a license is added separately.
