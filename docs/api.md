# Prince Net — API

> **Implementation status:** Code and documentation complete. Operational testing and production deployment pending.

---

## 1. General

- **Base URL:** `http://<host>:<port>`
- **Prefix:** `/api/v1`
- **Format:** JSON
- **Auth:** JWT in HttpOnly Cookie + CSRF token for mutations

### Response Shape

Success:
```json
{ "success": true, "data": { ... } }
```

Success (paginated):
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "limit": 25, "total": 250, "totalPages": 10 }
}
```

Error:
```json
{ "success": false, "message": "...", "code": "..." }
```

### Pagination

Query params accepted by all list endpoints:

- `page` (default: 1)
- `limit` (default: 25, max: 100)
- `search` (optional)
- `sort` (optional, where supported)
- `order` (`asc` | `desc`, default: `desc`)

### Money

All monetary values are returned as **strings** with 2 decimal places. Example: `"1250.50"`.

---

## 2. Auth

### POST /auth/csrf — Public

Generates CSRF cookie + returns token.

Response:
```json
{ "csrfToken": "..." }
```

### POST /auth/login — Public

Rate limited: 10 requests / minute.

Request:
```json
{ "email": "admin@prince-net.local", "password": "..." }
```

Response:
```json
{ "user": { "id": "uuid", "email": "admin@prince-net.local" } }
```

Sets `prince_net_token` HttpOnly cookie.

### POST /auth/logout — Protected

Clears the auth cookie.

### GET /auth/me — Protected

Response:
```json
{ "user": { "id": "uuid", "email": "..." } }
```

### POST /auth/change-password — Protected

Request:
```json
{
  "currentPassword": "...",
  "newPassword": "...",
  "confirmPassword": "..."
}
```

On success: clears auth cookie.

---

## 3. Packages

| Method | Path | Notes |
|--------|------|-------|
| GET | `/packages` | paginated, `search`, `status`, `order` |
| GET | `/packages/:id` | |
| POST | `/packages` | |
| PATCH | `/packages/:id` | |
| POST | `/packages/:id/activate` | |
| POST | `/packages/:id/deactivate` | |

---

## 4. Inventory

| Method | Path | Notes |
|--------|------|-------|
| GET | `/inventory` | returns `InventoryRow[]` (no pagination) |
| GET | `/inventory/:packageId` | returns summary + batches |
| GET | `/inventory/:packageId/movements` | paginated, `order` |
| POST | `/inventory/add` | creates PackageStock + ADD movement |
| POST | `/inventory/adjust` | Serializable + FOR UPDATE + retry |
| POST | `/inventory/return` | creates RETURN movement |

---

## 5. Distributors

| Method | Path | Notes |
|--------|------|-------|
| GET | `/distributors` | paginated, `search`, `status` |
| GET | `/distributors/:id` | |
| POST | `/distributors` | |
| PATCH | `/distributors/:id` | |
| GET | `/distributors/:id/balance` | computed |
| GET | `/distributors/:id/sales` | paginated |
| GET | `/distributors/:id/payments` | paginated |

---

## 6. Sales

| Method | Path | Notes |
|--------|------|-------|
| GET | `/sales` | paginated, `status`, `distributorId`, `order` |
| GET | `/sales/:id` | returns `SaleDetails` |
| POST | `/sales` | FIFO + Transaction |
| POST | `/sales/:id/cancel` | reverses payments + restores inventory |

---

## 7. Payments

| Method | Path | Notes |
|--------|------|-------|
| GET | `/sales/:saleId/payments` | paginated |
| POST | `/sales/:saleId/payments` | overpayment prevented |
| POST | `/payments/:id/reverse` | status → REVERSED |

---

## 8. Cash

| Method | Path | Notes |
|--------|------|-------|
| GET | `/cash/balance` | computed |
| GET | `/cash/movements` | paginated, `direction`, `sourceType`, `dateFrom`, `dateTo` |
| POST | `/cash/manual-in` | |
| POST | `/cash/manual-out` | |

---

## 9. Lines

| Method | Path | Notes |
|--------|------|-------|
| GET | `/lines` | paginated, `search`, `status` |
| GET | `/lines/:id` | |
| POST | `/lines` | |
| PATCH | `/lines/:id` | |

---

## 10. Line Payments

| Method | Path | Notes |
|--------|------|-------|
| GET | `/lines/:lineId/payments` | paginated |
| POST | `/lines/:lineId/payments` | |
| POST | `/line-payments/:id/reverse` | status → REVERSED |

---

## 11. Expenses

| Method | Path | Notes |
|--------|------|-------|
| GET | `/expenses` | paginated, `categoryId`, `status`, `dateFrom`, `dateTo` |
| GET | `/expenses/:id` | |
| POST | `/expenses` | |
| PATCH | `/expenses/:id` | only if ACTIVE |
| POST | `/expenses/:id/reverse` | only if ACTIVE |

---

## 12. Expense Categories

| Method | Path | Notes |
|--------|------|-------|
| GET | `/expense-categories` | no pagination |
| POST | `/expense-categories` | |
| PATCH | `/expense-categories/:id` | |
| POST | `/expense-categories/:id/activate` | |
| POST | `/expense-categories/:id/deactivate` | |

---

## 13. Owner Withdrawals

| Method | Path | Notes |
|--------|------|-------|
| GET | `/owner-withdrawals` | paginated, `status`, `dateFrom`, `dateTo` |
| POST | `/owner-withdrawals` | |
| POST | `/owner-withdrawals/:id/reverse` | |

---

## 14. Reports

All reports return aggregated data computed in Backend.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/reports/sales` | `dateFrom`, `dateTo`, `distributorId`, `packageId`, `status` |
| GET | `/reports/cash` | `dateFrom`, `dateTo` |
| GET | `/reports/inventory` | `dateFrom`, `dateTo` |
| GET | `/reports/distributors` | — |
| GET | `/reports/expenses` | `dateFrom`, `dateTo` |
| GET | `/reports/lines` | — |

---

## 15. Search

| Method | Path | Notes |
|--------|------|-------|
| GET | `/search?q=` | 20 results max across all types |

Search covers: Distributors, Packages, Sales, Lines, Expenses.

---

## 16. Audit Logs

| Method | Path | Notes |
|--------|------|-------|
| GET | `/audit-logs` | paginated, `action`, `entityType`, `userId`, `dateFrom`, `dateTo` |
| GET | `/audit-logs/:id` | |

Order: `createdAt DESC` (fixed).

---

## 17. Backups

| Method | Path | Notes |
|--------|------|-------|
| GET | `/backups` | no pagination |
| GET | `/backups/:id` | |
| POST | `/backups` | creates snapshot + file |
| POST | `/backups/:id/restore` | replaces all data |

**Note:** `storagePath` is never returned by the API.

---

## 18. Settings

| Method | Path | Notes |
|--------|------|-------|
| GET | `/settings` | singleton |
| PATCH | `/settings` | partial update |

---

## 19. Dashboard

| Method | Path | Notes |
|--------|------|-------|
| GET | `/dashboard` | computed summary + charts |

---

## 20. Security

- **JWT** — HttpOnly Cookie, `SameSite`, `Secure` in production
- **CSRF** — required on POST/PATCH/PUT/DELETE
- **Rate limiting** — global 120/minute; login 10/minute
- **Helmet** — security headers
- **CORS** — restricted to configured origin
- **Argon2** — password hashing

---

## 21. Errors

Standard error codes include:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `INSUFFICIENT_STOCK`
- `OVERPAYMENT`
- `SALE_ALREADY_CANCELLED`
- `PAYMENT_ALREADY_REVERSED`
- `PACKAGE_INACTIVE`
- `DISTRIBUTOR_INACTIVE`
- `CSRF_INVALID`

Each error response includes `success: false`, `message`, and `code`.