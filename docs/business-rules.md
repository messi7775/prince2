# Prince Net — Business Rules

> **Implementation status:** Code and documentation complete. Operational testing and production deployment pending.

---

## 1. Money

- Stored as `NUMERIC(12,2)` in PostgreSQL
- Handled as `Prisma.Decimal` in Backend
- Sent as `string` in API responses (always 2 decimal places)
- Handled as `MoneyString` in Frontend
- **No `Number()`, `parseFloat()`, `toFixed()` for money anywhere**
- **No floating-point errors**

---

## 2. Inventory Ledger

- Current stock = `SUM(inventory_movements.quantity_delta)`
- Never stored in a column
- Movement types:
  - `ADD` — incoming stock (positive)
  - `SELL` — outgoing at sale (negative)
  - `RETURN` — restored (positive)
  - `ADJUSTMENT` — manual correction (+/-)
- `unit_price` stored on each movement as a historical snapshot
- Related to `PackageStock` (batch) via `package_stock_id`
- **FIFO** applied at sale time:
  1. Order by `received_at ASC`
  2. Then `created_at ASC`
  3. Then `id ASC`

---

## 3. Cash Ledger

- Balance = `SUM(cash_movements.IN) - SUM(cash_movements.OUT)`
- Never stored in a column
- Sources:
  - `OPENING`
  - `SALE_PAYMENT`
  - `SALE_PAYMENT_REVERSAL`
  - `EXPENSE`
  - `EXPENSE_REVERSAL`
  - `LINE_PAYMENT`
  - `LINE_PAYMENT_REVERSAL`
  - `OWNER_WITHDRAWAL`
  - `OWNER_WITHDRAWAL_REVERSAL`
  - `MANUAL`
- Every financial mutation creates a cash movement

---

## 4. Distributor Balance

- Balance = `SUM(ACTIVE sales.total_amount) - SUM(ACTIVE payments.amount)`
- Only ACTIVE sales count
- Only ACTIVE payments count
- CANCELLED sales and REVERSED payments are excluded
- **Never stored in a column**

---

## 5. Sales

### Creation

- Requires ACTIVE distributor
- Requires ACTIVE packages
- Verifies stock via FIFO allocation
- Prices are read from DB (`Package.price`) — **never from Frontend**
- Stores historical snapshots in `sale_items`:
  - `package_name_snapshot`
  - `unit_price`
  - `total_price`
- `total_amount` = sum of items
- Optional initial payment allowed
- If initial payment exceeds total → rejected (`OVERPAYMENT`)
- All inside **one transaction**
- Uses `Serializable` + `SELECT FOR UPDATE` on package stocks

### Cancellation

- Only ACTIVE sales can be cancelled
- Cancelling a sale:
  1. Reverses all ACTIVE payments (status → `REVERSED`)
  2. Creates `SALE_PAYMENT_REVERSAL` cash movements
  3. Restores inventory via `RETURN` movements
  4. Sets `status = CANCELLED`
  5. Writes audit log
- All inside **one transaction**

---

## 6. Payments

### Creation

- Only on ACTIVE sales
- `SUM(ACTIVE payments) + new ≤ sale.total_amount`
- Overpayment rejected (`OVERPAYMENT`)
- Creates `SALE_PAYMENT` cash movement
- Uses `Serializable` + `FOR UPDATE` on Sale

### Reversal

- Only ACTIVE payments can be reversed
- Reversal:
  - Sets `status = REVERSED`
  - Stores `reversed_at`, `reversed_by`, `reversal_reason`
  - Creates `SALE_PAYMENT_REVERSAL` cash movement
- **Never deleted**

---

## 7. Expenses

### Creation

- Requires ACTIVE category
- Creates `EXPENSE` cash movement (OUT)
- Audit log entry

### Update

- Only ACTIVE expenses can be updated

### Reversal

- Only ACTIVE expenses can be reversed
- Reversal creates `EXPENSE_REVERSAL` cash movement (IN)
- **Never deleted**

---

## 8. Line Payments

### Creation

- Creates `LINE_PAYMENT` cash movement (OUT)
- Audit log entry

### Reversal

- Only ACTIVE line payments can be reversed
- Reversal creates `LINE_PAYMENT_REVERSAL` cash movement (IN)
- **Never deleted**

---

## 9. Owner Withdrawals

### Creation

- Requires `amount`, `reason`
- Creates `OWNER_WITHDRAWAL` cash movement (OUT)
- Audit log entry

### Reversal

- Only ACTIVE withdrawals can be reversed
- Reversal creates `OWNER_WITHDRAWAL_REVERSAL` cash movement (IN)
- **Never deleted**

---

## 10. Reversals — General Rule

- **No financial record is ever hard-deleted**
- Reversal pattern:
  - status → `REVERSED`
  - `reversed_at`, `reversed_by`, `reversal_reason` filled
  - Opposite cash movement created
- **Never modify historical values**

---

## 11. Transactions

Operations that span multiple tables run in a single Prisma transaction.

Examples:

- `POST /sales`
- `POST /sales/:id/cancel`
- `POST /payments`
- `POST /payments/:id/reverse`
- `POST /inventory/add`
- `POST /inventory/adjust`
- `POST /inventory/return`
- `POST /expenses`
- `POST /expenses/:id/reverse`
- `POST /line-payments`
- `POST /owner-withdrawals`
- `POST /cash/manual-in`
- `POST /cash/manual-out`
- `POST /backups`
- `POST /backups/:id/restore`

On any error: full rollback.

---

## 12. Concurrency

- **Inventory:** `Serializable` + `SELECT FOR UPDATE` on `package_stocks`
- **Sales:** `Serializable` + retry on `P2034` (write conflict)
- **Payments:** `Serializable` + retry on `P2034`
- **Backup:** advisory lock (`pg_advisory_xact_lock`)
- **Restore:** advisory lock + `Serializable`

---

## 13. Audit Log

Every sensitive operation writes an `audit_logs` row with:

- `user_id`
- `action`
- `entity_type`
- `entity_id`
- `old_values` (JSONB)
- `new_values` (JSONB)
- `ip_address`
- `user_agent`
- `created_at`

Actions covered (28 total) — see `database.md`.

---

## 14. Backup

- **Creation:**
  - Advisory lock
  - `REPEATABLE READ` snapshot of all 17 tables
  - Snapshot written to file **outside** the transaction
  - SHA-256 checksum + size stored
  - `storagePath` never returned by API
- **Restore:**
  - Checksum verified before reading
  - `schemaVersion` verified
  - `Serializable` transaction: delete + insert
  - After commit: `BACKUP_RESTORED` audit entry
  - Frontend: clears session and redirects to login

---

## 15. Settings

- `singleton_key = "main"` is a DB-level guarantee
- `admin_email` is the **invoice admin email**, distinct from `users.email`
- Partial update allowed (PATCH)

---

## 16. FIFO Rule

When selling a package:

1. Find all `package_stocks` for the package
2. Order by `received_at ASC, created_at ASC, id ASC`
3. Allocate requested quantity across batches
4. Insert `SELL` movement per batch used

Executed inside the sale transaction with `Serializable` isolation.

---

## 17. Immutability of Prices

- `Package.price` may change over time
- `sale_items.unit_price` preserves historical price
- `package_stocks.unit_price` preserves batch cost
- `inventory_movements.unit_price` preserves movement price
- **Changing a package price never affects past transactions**

---

## 18. No Hidden Profit Calculation

The system does **not** compute:

- Net profit
- COGS
- Assets / Liabilities
- Equity

It shows: sales, payments, expenses, cash, debt, inventory. Any accounting statement is out of scope.

---

## 19. No Multi-User

- Single Admin only
- No register, no roles, no permissions
- Password change is the only user mutation