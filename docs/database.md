# Prince Net — Database

> **Implementation status:** Code and documentation complete. Operational testing and production deployment pending.

---

## 1. Overview

- **Database:** PostgreSQL
- **ORM:** Prisma 6
- **Tables:** 17
- **Enums:** 10
- **Primary keys:** `UUID` (`@default(uuid())`)
- **Money:** `NUMERIC(12,2)`
- **Timestamps:** `TIMESTAMPTZ(6)`
- **Date-only:** `DATE` (used rarely)

---

## 2. Enums (10)

### EntityStatus

```
ACTIVE | INACTIVE
```

Used by: `Package`, `Distributor`, `Line`

### SaleStatus

```
ACTIVE | CANCELLED
```

Used by: `Sale`

### PaymentStatus

```
ACTIVE | REVERSED
```

Used by: `Payment`

### LinePaymentStatus

```
ACTIVE | REVERSED
```

Used by: `LinePayment`

### ExpenseStatus

```
ACTIVE | REVERSED
```

Used by: `Expense`

### OwnerWithdrawalStatus

```
ACTIVE | REVERSED
```

Used by: `OwnerWithdrawal`

### InventoryMovementType

```
ADD | SELL | RETURN | ADJUSTMENT
```

Used by: `InventoryMovement`

### CashDirection

```
IN | OUT
```

Used by: `CashMovement`

### CashSourceType

```
OPENING
SALE_PAYMENT
SALE_PAYMENT_REVERSAL
EXPENSE
EXPENSE_REVERSAL
LINE_PAYMENT
LINE_PAYMENT_REVERSAL
OWNER_WITHDRAWAL
OWNER_WITHDRAWAL_REVERSAL
MANUAL
```

Used by: `CashMovement`

### AuditAction

```
LOGIN
LOGIN_FAILED
PACKAGE_CREATED
PACKAGE_UPDATED
INVENTORY_ADDED
INVENTORY_ADJUSTED
INVENTORY_RETURNED
DISTRIBUTOR_CREATED
DISTRIBUTOR_UPDATED
SALE_CREATED
SALE_CANCELLED
PAYMENT_CREATED
PAYMENT_REVERSED
LINE_CREATED
LINE_UPDATED
LINE_PAYMENT_CREATED
LINE_PAYMENT_REVERSED
EXPENSE_CREATED
EXPENSE_UPDATED
EXPENSE_REVERSED
OWNER_WITHDRAWAL_CREATED
OWNER_WITHDRAWAL_REVERSED
CASH_MANUAL_IN
CASH_MANUAL_OUT
BACKUP_CREATED
BACKUP_RESTORED
SETTINGS_UPDATED
PASSWORD_CHANGED
```

Used by: `AuditLog`

---

## 3. Tables (17)

### 3.1 users

```
id              UUID PK
email           string UNIQUE
password_hash   string
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

Relations:
- → package_stocks
- → inventory_movements
- → sales (created / cancelled)
- → payments (created / reversed)
- → line_payments (created / reversed)
- → expenses (created / reversed)
- → owner_withdrawals (created / reversed)
- → cash_movements
- → audit_logs
- → backups

### 3.2 packages

```
id              UUID PK
name            string UNIQUE
price           NUMERIC(12,2)
data_size_mb    int
hours           int
color           string nullable
status          EntityStatus
description     text nullable
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

Indexes: `status`

### 3.3 package_stocks

```
id              UUID PK
package_id      UUID FK → packages (RESTRICT)
unit_price      NUMERIC(12,2)
received_at     TIMESTAMPTZ
notes           text nullable
created_by      UUID FK → users (RESTRICT)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

Indexes: `package_id`, `received_at`, `created_at`

### 3.4 inventory_movements

```
id                  UUID PK
package_stock_id    UUID FK → package_stocks (RESTRICT)
type                InventoryMovementType
quantity_delta      int
unit_price          NUMERIC(12,2)
reference_type      string nullable
reference_id        UUID nullable (no FK)
description         text nullable
created_by          UUID FK → users (RESTRICT)
created_at          TIMESTAMPTZ
```

Indexes: `package_stock_id`, `type`, (`reference_type`, `reference_id`), `created_at`

**Note:** current stock is derived, never stored.

### 3.5 distributors

```
id                  UUID PK
name                string
phone               string
address             text nullable
notes               text nullable
status              EntityStatus
registration_date   TIMESTAMPTZ
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Indexes: `name`, `phone`, `status`

### 3.6 sales

```
id                      UUID PK
invoice_number          string UNIQUE
distributor_id          UUID FK → distributors (RESTRICT)
total_amount            NUMERIC(12,2)
status                  SaleStatus
sale_date               TIMESTAMPTZ
notes                   text nullable
created_by              UUID FK → users (RESTRICT)
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
cancelled_at            TIMESTAMPTZ nullable
cancelled_by            UUID FK → users nullable (RESTRICT)
cancellation_reason     text nullable
```

Indexes: `distributor_id`, `sale_date`, `status`

### 3.7 sale_items

```
id                      UUID PK
sale_id                 UUID FK → sales (RESTRICT)
package_id              UUID FK → packages (RESTRICT)
package_name_snapshot   string
quantity                int
unit_price              NUMERIC(12,2)
total_price             NUMERIC(12,2)
created_at              TIMESTAMPTZ
```

Indexes: `sale_id`, `package_id`

**Note:** `unit_price` is a historical snapshot.

### 3.8 payments

```
id                  UUID PK
sale_id             UUID FK → sales (RESTRICT)
amount              NUMERIC(12,2)
status              PaymentStatus
payment_date        TIMESTAMPTZ
notes               text nullable
created_by          UUID FK → users (RESTRICT)
created_at          TIMESTAMPTZ
reversed_at         TIMESTAMPTZ nullable
reversed_by         UUID FK → users nullable (RESTRICT)
reversal_reason     text nullable
```

Indexes: `sale_id`, `payment_date`, `status`

### 3.9 lines

```
id                  UUID PK
name                string
provider            string
identifier          string
speed               string nullable
cost                NUMERIC(12,2)
status              EntityStatus
subscription_date   TIMESTAMPTZ
notes               text nullable
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Indexes: `status`, `identifier`

### 3.10 line_payments

```
id                  UUID PK
line_id             UUID FK → lines (RESTRICT)
amount              NUMERIC(12,2)
period              string
status              LinePaymentStatus
payment_date        TIMESTAMPTZ
notes               text nullable
created_by          UUID FK → users (RESTRICT)
created_at          TIMESTAMPTZ
reversed_at         TIMESTAMPTZ nullable
reversed_by         UUID FK → users nullable (RESTRICT)
reversal_reason     text nullable
```

Indexes: `line_id`, `payment_date`, `status`

### 3.11 expense_categories

```
id              UUID PK
name            string UNIQUE
description     text nullable
is_active       boolean
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### 3.12 expenses

```
id                  UUID PK
category_id         UUID FK → expense_categories (RESTRICT)
description         text
amount              NUMERIC(12,2)
status              ExpenseStatus
expense_date        TIMESTAMPTZ
notes               text nullable
created_by          UUID FK → users (RESTRICT)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
reversed_at         TIMESTAMPTZ nullable
reversed_by         UUID FK → users nullable (RESTRICT)
reversal_reason     text nullable
```

Indexes: `category_id`, `expense_date`, `status`

### 3.13 owner_withdrawals

```
id                  UUID PK
amount              NUMERIC(12,2)
reason              string
status              OwnerWithdrawalStatus
withdrawal_date     TIMESTAMPTZ
notes               text nullable
created_by          UUID FK → users (RESTRICT)
created_at          TIMESTAMPTZ
reversed_at         TIMESTAMPTZ nullable
reversed_by         UUID FK → users nullable (RESTRICT)
reversal_reason     text nullable
```

Indexes: `withdrawal_date`, `status`

### 3.14 cash_movements

```
id              UUID PK
direction       CashDirection
amount          NUMERIC(12,2)
source_type     CashSourceType
source_id       UUID nullable (no FK)
description     text nullable
movement_date   TIMESTAMPTZ
created_by      UUID FK → users (RESTRICT)
created_at      TIMESTAMPTZ
```

Indexes: `source_type`, (`source_type`, `source_id`), `movement_date`, `direction`

**Note:** cash balance is derived, never stored.

### 3.15 audit_logs

```
id              UUID PK
user_id         UUID FK → users (RESTRICT)
action          AuditAction
entity_type     string
entity_id       UUID nullable
old_values      JSONB nullable
new_values      JSONB nullable
ip_address      string nullable
user_agent      string nullable
created_at      TIMESTAMPTZ
```

Indexes: (`entity_type`, `entity_id`), `created_at`, `action`

### 3.16 backups

```
id              UUID PK
file_name       string
storage_path    string
size_bytes      BIGINT
record_count    int
checksum        string
created_by      UUID FK → users (RESTRICT)
created_at      TIMESTAMPTZ
```

Indexes: `created_at`

**Note:** `storage_path` is internal only — never returned by the API.

### 3.17 settings

```
id                  UUID PK
singleton_key       string UNIQUE (fixed: "main")
network_name        string
currency_name       string
currency_symbol     string
admin_email         string
low_stock_threshold int
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Note:** `singleton_key` is a database-level guarantee of a single row.

---

## 4. Relations Summary

```
User ─── PackageStock
User ─── InventoryMovement
User ─── Sale (created / cancelled)
User ─── Payment (created / reversed)
User ─── LinePayment (created / reversed)
User ─── Expense (created / reversed)
User ─── OwnerWithdrawal (created / reversed)
User ─── CashMovement
User ─── AuditLog
User ─── Backup

Package ─── PackageStock
Package ─── SaleItem

PackageStock ─── InventoryMovement

Distributor ─── Sale

Sale ─── SaleItem
Sale ─── Payment

Line ─── LinePayment

ExpenseCategory ─── Expense
```

---

## 5. Deletion Policy

All financial relations use `onDelete: Restrict`:

- `sale_items.sale_id`
- `payments.sale_id`
- `inventory_movements.package_stock_id`
- `cash_movements.created_by`
- `audit_logs.user_id`
- etc.

**No financial record is ever hard-deleted.** Reversals are used instead.

---

## 6. Money Representation

- **DB:** `NUMERIC(12,2)`
- **Prisma:** `Decimal`
- **API:** string via `toFixed(2)` on `Prisma.Decimal`
- **Frontend:** `MoneyString` — displayed via `formatMoney`
- **No `Number()` for money anywhere**

---

## 7. Key Design Rules

1. No stored `current_stock`
2. No stored `cash_balance`
3. No stored `distributor_balance`
4. No stored `paid_amount` / `remaining_amount`
5. All financial records use reversal, not deletion
6. Historical snapshots stored in `sale_items.unit_price`, `package_name_snapshot`
7. FIFO applied at sale time using `received_at`, `created_at`, `id`
8. `settings` is a singleton via `singleton_key`