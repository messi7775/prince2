# 📘 توثيق شامل — Prince Net Management System

> **مرجع مستقل وكامل للمشروع.** كُتب هذا الملف اعتمادًا على فحص الكود الفعلي، Prisma Schema، الـ Migrations، الـ API، الواجهة، وملفات الإعداد والتشغيل — لا على التخمين.
>
> إذا أُعطي هذا الملف لمطوّر أو AI آخر، يجب أن يستطيع فهم النظام وبنيته وقاعدة بياناته وطريقة تشغيله وصيانته ونقله دون الرجوع لأي محادثات سابقة.

---

## 📑 جدول المحتويات

1. [فكرة النظام والهدف وطريقة عمله](#1-فكرة-النظام-والهدف-وطريقة-عمله)
2. [الصفحات الحالية ووظيفة كل صفحة](#2-الصفحات-الحالية-ووظيفة-كل-صفحة)
3. [ترابط الصفحات وتدفق البيانات والعمليات](#3-ترابط-الصفحات-وتدفق-البيانات-والعمليات)
4. [الـ Architecture الكامل](#4-الـ-architecture-الكامل)
5. [الـ Modules وServices وControllers وHooks](#5-الـ-modules-وservices-وcontrollers-وhooks)
6. [توثيق جميع API Endpoints](#6-توثيق-جميع-api-endpoints)
7. [شرح جميع الخدمات (Domains)](#7-شرح-جميع-الخدمات-domains)
8. [قواعد العمل والمنطق المالي بالتفصيل](#8-قواعد-العمل-والمنطق-المالي-بالتفصيل)
9. [آلية Authentication وJWT وCSRF](#9-آلية-authentication-وjwt-وcsrf)
10. [التقنيات والمكتبات والإصدارات الفعلية](#10-التقنيات-والمكتبات-والإصدارات-الفعلية)
11. [هيكل المشروع والمجلدات](#11-هيكل-المشروع-والمجلدات)
12. [pnpm Workspace والـ Shared Packages](#12-pnpm-workspace-والـ-shared-packages)
13. [توثيق قاعدة البيانات بالكامل](#13-توثيق-قاعدة-البيانات-بالكامل)
14. [الـ Migrations وترتيبها والغرض منها](#14-الـ-migrations-وترتيبها-والغرض-منها)
15. [Database From Scratch — إنشاء قاعدة جديدة كاملة](#15-database-from-scratch--إنشاء-قاعدة-جديدة-كاملة)
16. [النسخ الاحتياطي الخارجي (pg_dump / pg_restore) ونقل قاعدة البيانات](#16-النسخ-الاحتياطي-الخارجي-pg_dump--pg_restore-ونقل-قاعدة-البيانات)
17. [الفرق بين نقل Schema فقط / Schema + Data / المشروع كاملًا](#17-الفرق-بين-نقل-schema-فقط--schema--data--المشروع-كاملًا)
18. [استعلامات SQL لفحص سلامة البيانات](#18-استعلامات-sql-لفحص-سلامة-البيانات)
19. [نظام Backup/Restore الداخلي في التطبيق](#19-نظام-backuprestore-الداخلي-في-التطبيق)
20. [التشغيل محليًا على Windows من الصفر](#20-التشغيل-محليًا-على-windows-من-الصفر)
21. [التشغيل باستخدام Docker (docker-compose.base44.yml)](#21-التشغيل-باستخدام-docker-docker-composebase44yml)
22. [المنافذ والخدمات وكيفية اتصالها](#22-المنافذ-والخدمات-وكيفية-اتصالها)
23. [أوامر المشروع المهمة](#23-أوامر-المشروع-المهمة)
24. [ملفات .env ومتغيرات البيئة](#24-ملفات-env-ومتغيرات-البيئة)
25. [🔒 Private Environment & Credentials](#25--private-environment--credentials)
26. [حسابات Admin وإنشاء Admin جديد](#26-حسابات-admin-وإنشاء-admin-جديد)
27. [نقل المشروع بالكامل إلى جهاز آخر](#27-نقل-المشروع-بالكامل-إلى-جهاز-آخر)
28. [إنشاء نسخة جديدة من المشروع بقاعدة فارغة](#28-إنشاء-نسخة-جديدة-من-المشروع-بقاعدة-فارغة)
29. [Deployment / Production](#29-deployment--production)
30. [Security — إعدادات الأمان الحالية](#30-security--إعدادات-الأمان-الحالية)
31. [Troubleshooting — المشاكل الشائعة وحلولها](#31-troubleshooting--المشاكل-الشائعة-وحلولها)
32. [Maintenance — تحديث المشروع مستقبلًا بأمان](#32-maintenance--تحديث-المشروع-مستقبلًا-بأمان)

---

## 1. فكرة النظام والهدف وطريقة عمله

**Prince Net Management System** هو نظام إدارة ومحاسبة متكامل لعمل شبكة إنترنت محلي (Internet Network Business). النظام يدير:

- **الباقات (Packages):** باقات الإنترنت المباعة (سعر، حجم بيانات، ساعات، لون).
- **المخزون (Inventory):** دفعات (Batches) لكل باقة بسعر شراء تاريخي، مع FIFO عند البيع.
- **الموزعون (Distributors):** العملاء/الموزعون الذين تُباع لهم الباقات بالجملة، مع حساب رصيد كل موزع.
- **المبيعات (Sales):** فواتير بيع متعددة البنود، مع تخصيص FIFO تلقائي ودفعات جزئية.
- **المدفوعات (Payments):** دفعات موزعين مقابل فواتير المبيعات.
- **الصندوق (Cash):** حركات نقدية (قبض/صرف) مصدرها المبيعات، المدفوعات، المصروفات، السحوبات، أو إدخال/إخراج يدوي.
- **الخطوط (Lines) ومدفوعات الخطوط (Line Payments):** خطوط الإنترنت المشتركة من الموردين وتكلفة اشتراكاتها الشهرية.
- **المصروفات (Expenses) وتصنيفاتها (Expense Categories).**
- **سحوبات المالك (Owner Withdrawals):** مبالغ يسحبها المالك من الصندوق.
- **التقارير (Reports)** الشاملة لكل المجالات.
- **سجل العمليات (Audit Logs):** تتبع كامل لكل عملية مع القيم قبل/بعد.
- **النسخ الاحتياطي (Backup/Restore)** داخل التطبيق.
- **الإعدادات (Settings):** اسم الشبكة، العملة، حد المخزون المنخفض... إلخ.

### طريقة عمل النظام (باختصار)

1. يُنشئ المسؤول **الباقات** ويضيف **دفعات مخزون** لكل باقة (بسعر شراء لكل دفعة).
2. يُسجّل **الموزعين**، ثم تُنشأ لهم **فواتير مبيعات** من باقات متعددة — الواجهة الخلفية توزع الكمية على دفعات المخزون بقاعدة **FIFO** وتحسب إجمالي الفاتورة من أسعار الدفعات المخصصة.
3. تُسجَّل **دفعات الموزعين** مقابل الفواتير، وكل دفع يولّد حركة نقدية **IN** في الصندوق.
4. تُسجَّل **المصروفات** و**مدفوعات الخطوط** و**سحوبات المالك** — كل منها يولّد حركة نقدية **OUT**.
5. **لا يُحذف أي سجل مالي** — العمليات الخاطئة تُعكس (REVERSED) مع حركة نقدية عكسية موثقة، للحفاظ على سلامة السجل المالي.
6. **كل قيمة مالية مشتقة** (رصيد موزع، رصيد صندوق، مخزون حالي، مدفوع فاتورة) تُحسب لحظيًا من الـ Ledger (حركات المخزون/النقد/المدفوعات) ولا تُخزن — فلا تناقض ممكن.

---

## 2. الصفحات الحالية ووظيفة كل صفحة

الواجهة هي React SPA (Vite) بلغة عربية (RTL). جميع الصفحات محمية بتسجيل دخول ما عدا صفحة الدخول. المسارات معرّفة في `apps/web/src/app/routes.tsx` وقائمة التنقل في `apps/web/src/components/layout/Sidebar.tsx`.

| المسار | الصفحة (الاسم في القائمة الجانبية) | الوظيفة والأزرار/العمليات المهمة |
|---|---|---|
| `/login` | صفحة تسجيل الدخول | نموذج بريد + كلمة مرور، زر دخول. |
| `/dashboard` | لوحة التحكم | الملخص المالي (إجماليات المدفوعات/المصروفات/السحوبات، الداخل/الخارج من الصندوق، الرصيد الحالي، عدد العمليات — باستثناء المعكوسة)، ديون الموزعين، تنبيهات المخزون المنخفض، أحدث العمليات، الباقات الأكثر مبيعًا. |
| `/packages` | الباقات | جدول الباقات؛ إنشاء/تعديل باقة (اسم، سعر، حجم بيانات MB، ساعات، لون، وصف)، تفعيل/تعطيل باقة. |
| `/inventory` | المخزون | جدول المخزون لكل باقة (الكمية الحالية المحسوبة)؛ إضافة دفعة، فحص المخزون المنخفض. |
| `/inventory/:packageId` | تفاصيل مخزون باقة | دفعات الباقة (سعر الوحدة، تاريخ الاستلام)، حركات المخزون، تعديل دفعة، حذف دفعة، تسوية (Adjust)، إرجاع (Return)، إضافة كمية. |
| `/distributors` | الموزعون | جدول الموزعين؛ إنشاء/تعديل موزع (اسم، هاتف، عنوان، ملاحظات)، تفعيل/تعطيل. |
| `/distributors/:id` | تفاصيل موزع | بيانات الموزع، الرصيد المستحق (مبيعات نشطة − مدفوعات نشطة)، تاريخ مبيعاته، تاريخ مدفوعاته، تسجيل دفعة جديدة. |
| `/sales` | المبيعات | جدول الفواتير مع فلاتر (حالة الدفع، تاريخ، ترتيب)؛ إنشاء فاتورة (موزع + بنود باقات متعددة + دفعة أولية اختيارية)؛ زر مشاركة PDF للإيصال. |
| `/sales/:id` | تفاصيل فاتورة | بنود الفاتورة (باقات بأسعارها لحظة البيع)، المدفوعات، المدفوع/المتبقي، تعديل بنود الفاتورة، إلغاء الفاتورة (بحجة إلزامية)، تسجيل دفعة، عكس دفعة (Reverse) — زر مشاركة PDF. |
| `/cash` | الصندوق | الرصيد الحالي، حركات نقدية بفلاتر (نوع المصدر، اتجاه، تاريخ)، حركة يدوية داخل (Manual In) / خارج (Manual Out). |
| `/lines` | الخطوط | جدول خطوط الإنترنت (اسم، مزود، معرّف، سرعة، تكلفة، تاريخ الاشتراك)؛ إنشاء/تعديل/تفعيل/تعطيل/حذف خط. |
| `/lines/:id` | تفاصيل خط | بيانات الخط، مدفوعاته (بدفعات شهرية period)، تسجيل دفعة خط، عكس دفعة خط (Reverse) — زر مشاركة PDF. |
| `/expense-categories` | تصنيفات المصروفات (تُفتح من صفحة المصروفات) | إنشاء/تعديل/تفعيل/تعطيل/حذف تصنيف. |
| `/expenses` | المصروفات | جدول المصروفات بفلاتر (تصنيف، حالة، تاريخ) وترتيب؛ إنشاء/تعديل مصروف، عكس مصروف (Reverse) — زر مشاركة PDF. |
| `/owner-withdrawals` | سحوبات المالك | جدول السحوبات؛ إنشاء/تعديل سحب (المبلغ + السبب إلزامي)، عكس سحب (Reverse) — زر مشاركة PDF. |
| `/reports` | التقارير | تقارير: المبيعات، الصندوق، المخزون، الموزعون، المصروفات، الخطوط، التحصيلات، سحوبات المالك — بفلاتر تاريخ ومدخلات أخرى؛ تصدير/مشاركة PDF. |
| `/search` | البحث | بحث شامل (`GET /search?q=`) عبر الكيانات (فواتير، موزعون، باقات، خطوط...). |
| `/audit-log` | سجل العمليات | سجل تدقيق كامل بفلاتر (نوع العملية، الكيان، المستخدم، تاريخ)؛ تفاصيل كل عملية (old/new values، IP، User Agent). |
| `/backup` | النسخ الاحتياطي | إنشاء نسخة JSON snapshot، تنزيلها، استعادتها، حذف نسخة، حذف كل النسخ. |
| `/settings` | الإعدادات | اسم الشبكة، اسم العملة، رمز العملة، البريد الإداري (الظاهر في الفواتير)، حد المخزون المنخفض؛ تغيير كلمة المرور موجود في مسار المصادقة (`POST /auth/change-password`). |

> ملاحظة: `/line-payments` مسار قديم يُحوّل (Navigate) إلى `/lines`.

---

## 3. ترابط الصفحات وتدفق البيانات والعمليات

تدفق عمل نموذجي يوضح ترابط الصفحات:

```
الباقات (/packages) ──► المخزون (/inventory) ──► فاتورة جديدة من (/sales)
                                                      │
                         دفعة أولية اختيارية ◄────────┤ (FIFO allocation + Cash IN)
                                                      ▼
                                     الموزع (/distributors/:id) ── دفعات لاحقة
                                                      │ (كل دفعة = Cash IN)
                                                      ▼
الصندوق (/cash) ◄── حركات OUT من: (/expenses), (/lines/:id دفعات خطوط),
                    (/owner-withdrawals), إدخال/إخراج يدوي
                                                      │
لوحة التحكم والتقارير (/dashboard, /reports) ◄── قراءة من كل الـ Ledgers
                                                      │
سجل العمليات (/audit-log) ◄── يوثّق كل ما سبق تلقائيًا
```

- **كل عملية بيع** تعتمد على وجود باقة نشطة + مخزون كافٍ (وإلا يُرفض الطلب)، وتحدّث رصيد الموزع (المشتَق).
- **كل دفعة/مصروف/سحب/دفع خط** يُنشئ حركة في `cash_movements` تلقائيًا داخل نفس الـ transaction.
- **العكس (Reverse)** لأي عملية مالية يُنشئ حركة نقدية عكسية (مثل `SALE_PAYMENT_REVERSAL`) ويحوّل السجل إلى `REVERSED` بدون أي حذف.
- **إلغاء فاتورة** (CANCELLED) يُرجع الكميات المخصصة للمخزون (حركات RETURN) ويعكس الدفعات المرتبطة بها.
- الواجهة تستخدم **React Query (TanStack Query)** لكل الطلبات: كل مجلد `features/<domain>` فيه `api/` (استدعاءات fetch)، `hooks/` (React Query hooks)، `components/`, `pages/`.
- كل الطلبات تمر عبر قاعدة `/api/v1` نسبية من خلال بروكسي Vite (Single-origin).

---

## 4. الـ Architecture الكامل

```
┌─────────────────────────── Browser ───────────────────────────┐
│  React 18 SPA (Vite 7 dev server, port 5173 → host port 3000) │
│  react-router-dom 6 + TanStack Query 5 + react-hook-form      │
│  Tailwind CSS 3 + Radix UI + lucide-react                     │
│  مسار الطلبات: fetch('/api/v1/...') نسبي                     │
└───────────────────────────────┬────────────────────────────────┘
                                │  /api → Vite proxy → API
┌───────────────────────────────▼────────────────────────────────┐
│ NestJS 11 API (apps/api) — internal port 3001 (Base44)          │
│ أو port 3000 محليًا (الافتراضي في main.ts / env.validation)     │
│ Global prefix: api/v1                                            │
│ Global guards: ThrottlerGuard + JwtAuthGuard (ما عدا @Public)   │
│ CSRF middleware (csrf-csrf) + helmet + cookie-parser + CORS      │
│ Validation: class-validator (whitelist) + ZodValidationPipe      │
│            (سكيماس مشتركة من @prince-net/validation)             │
└───────────────────────────────┬────────────────────────────────┘
                                │ Prisma Client 6.19 (driver adapter pg)
┌───────────────────────────────▼────────────────────────────────┐
│ PostgreSQL 16                                                    │
│ قاعدة prince_net + قاعدة ظل prince_net_shadow (لـ migrate dev)   │
└──────────────────────────────────────────────────────────────────┘
```

نقاط أساسية:

- **Single-origin في Base44:** Vite (5173) يبروكسي `/api` إلى `http://api:3001` عبر `API_PROXY_TARGET`. محليًا الافتراضي `http://localhost:3000` (نفس منفذ API المحلي).
- **Prisma generator:** `prisma-client-js` مع `engineType = "client"` (بدون Rust engine) + `@prisma/adapter-pg` (driver adapter). الـ client يُولَّد إلى `apps/api/src/generated/prisma` (موجود على الـ bind mount — يجب توليده في كل تشغيل).
- **المعاملات المالية:** PostgreSQL `NUMERIC(12,2)` تصل كـ `Prisma.Decimal`، والتحويل بين النص/Decimal يدار في `apps/api/src/common/utils/money.util.ts` بدون أي float.
- **الهوية (IDs):** UUID. **التواريخ:** `TIMESTAMPTZ(6)`.

---

## 5. الـ Modules وServices وControllers وHooks

### وحدات API (`apps/api/src/`)

| Module | الملفات | الوظيفة |
|---|---|---|
| `AppModule` | `app.module.ts` | تجميع كل الوحدات + Guards العامة (Throttler, JwtAuth) + Exception filter. |
| `PrismaModule` | `prisma/` | `PrismaService` (عميل Prisma مع adapter). |
| `ConfigModule` | `config/env.validation.ts` | تحقق Zod لمتغيرات البيئة عند الإقلاع (فشل = رفض الإقلاع). |
| `AuthModule` | `auth/` | تسجيل الدخول (argon2 + JWT cookie)، logout (رفع tokenVersion)، me، change-password، jwt.strategy. |
| `CsrfModule` | `csrf/` | `CsrfService` يهيئ middleware double-submit (`csrf-csrf`). |
| `UsersModule` | `users/` | `UsersService` فقط (بدون controller) — إدارة user/tokenVersion. |
| `HealthModule` | `health/` | `GET /health` (`@Public`) — فحص readiness شامل للـ DB. |
| `DashboardModule` | `dashboard/` | الملخص المالي والكروت لصفحة لوحة التحكم. |
| `PackagesModule` | `packages/` | CRUD الباقات + activate/deactivate. |
| `InventoryModule` | `inventory/` | المخزون، الدفعات، الحركات، add/adjust/return، low-stock. |
| `DistributorsModule` | `distributors/` | CRUD الموزعين + الرصيد + مبيعاتهم ومدفوعاتهم. |
| `SalesModule` | `sales/` | الفواتير: إنشاء (FIFO)، تعديل بنود، إلغاء، تفاصيل. مساعدات: `helpers/fifo.helper.ts`, `helpers/invoice-number.helper.ts`. |
| `PaymentsModule` | `payments/` | دفعات المبيعات: إنشاء، تعديل، عكس (Reverse). |
| `LinesModule` | `lines/` | خطوط الإنترنت CRUD (مع حذف فعلي للخط — ليس سجلًا ماليًا مستقلًا). |
| `LinePaymentsModule` | `line-payments/` | دفعات الخطوط: إنشاء وعكس. |
| `ExpenseCategoriesModule` | `expense-categories/` | تصنيفات المصروفات CRUD. |
| `ExpensesModule` | `expenses/` | المصروفات: إنشاء، تعديل، عكس. |
| `OwnerWithdrawalsModule` | `owner-withdrawals/` | سحوبات المالك: إنشاء، تعديل، عكس. |
| `CashModule` | `cash/` | رصيد الصندوق، الحركات بفلاتر، Manual In/Out. |
| `ReportsModule` | `reports/` | 8 تقارير (sales, cash, inventory, distributors, expenses, lines, collections, owner-withdrawals). |
| `SearchModule` | `search/` | بحث شامل (`q`). |
| `AuditModule` | `audit/` | كتابة AuditLog من كل الخدمات + قراءته بفلاتر. |
| `BackupsModule` | `backups/` | Backup/Restore الداخلي (JSON snapshot — انظر §19). |
| `SettingsModule` | `settings/` | سجل إعدادات Singleton. |
| `CommonModule` | `common/` | Decorators (`CurrentUser`, `Public`)، `BusinessException`, `HttpExceptionFilter`, `JwtAuthGuard`, `ZodValidationPipe`, utils (`money`, `pagination`, `with-serializable-retry` لإعادة المحاولة عند تعارض التسلسل). |

### هيكل مجلدات الواجهة (`apps/web/src/`)

```
app/        → App.tsx, providers.tsx, router.tsx, routes.tsx
components/ → layout/ (AppLayout, Sidebar, Header, MobileDrawer, Breadcrumbs,
              LowStockBanner, PageHeader, ThemeToggle)
              ui/ (button, card, dialog, table, toast, pagination, date-picker...)
              feedback/ (ConfirmDialog)
features/   → لكل مجال مجلد بنمط موحّد:
              api/     — دوال fetch (login, list, create, ...)
              hooks/   — React Query hooks (useAuth, useSales, usePayments...)
              components/ — جداول، نوافذ حوار، فلاتر
              pages/   — صفحات المسارات أعلاه
lib/        → api-client.ts (fetch موحّد مع CSRF)، pdf.ts (jspdf + html2canvas-pro
              لتوليد PDF الإيصالات)، use-share-pdf.ts (Web Share API)،
              print.ts، query-client.ts، audit-actions.ts، format.ts،
              date-helpers.ts، currency.ts، file-size.ts، utils.ts
```

---

## 6. توثيق جميع API Endpoints

**القاعدة:** `/{API_PREFIX}` = `/api/v1`. جميع المسارات محمية بـ JWT ما عدا المعلّمة بـ 🔓 (تستثنى بـ `@Public()`). جميع الطلبات المحرّكة (POST/PATCH/DELETE) محمية إضافةً بـ CSRF (رأس `x-csrf-token`).

### Auth — `auth.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | 🔓 `/auth/csrf` | إصدار CSRF token (double-submit cookie). |
| POST | 🔓 `/auth/login` | تسجيل دخول → HttpOnly JWT cookie + سجّل LOGIN / LOGIN_FAILED. |
| POST | `/auth/logout` | خروج (رفع tokenVersion → إبطال كل JWTs الصادرة قبله). |
| GET | `/auth/me` | بيانات المستخدم الحالي. |
| POST | `/auth/change-password` | تغيير كلمة المرور (+ إبطال الجلسات، سجل PASSWORD_CHANGED). |

### Packages — `packages.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/packages` | قائمة بفلاتر/صفحات (status...). |
| GET | `/packages/:id` | تفاصيل باقة. |
| POST | `/packages` | إنشاء. |
| PATCH | `/packages/:id` | تعديل. |
| POST | `/packages/:id/activate` \| `/packages/:id/deactivate` | تفعيل/تعطيل. |

### Inventory — `inventory.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/inventory` | ملخص المخزون لكل باقة (الكمية المحسوبة من الـ ledger). |
| GET | `/inventory/low-stock` | الباقات تحت حد المخزون المنخفض (من Settings). |
| GET | `/inventory/:packageId` | مخزون باقة. |
| GET | `/inventory/:packageId/movements` | حركات مخزون باقة. |
| POST | `/inventory/add` | إضافة دفعة (PackageStock + حركة ADD). |
| POST | `/inventory/adjust` | تسوية كمية دفعة (حركة ADJUSTMENT). |
| POST | `/inventory/return` | إرجاع كمية للدفعات (حركة RETURN). |
| PATCH | `/inventory/batches/:id` | تعديل دفعة. |
| DELETE | `/inventory/batches/:id` | حذف دفعة (مسموح فقط إن لم تُستخدم في حركات). |

### Distributors — `distributors.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/distributors` | قائمة بفلاتر/صفحات. |
| GET | `/distributors/:id` · `/distributors/:id/balance` · `/distributors/:id/sales` · `/distributors/:id/payments` | تفاصيل/رصيد/مبيعات/مدفوعات. |
| POST | `/distributors` · PATCH `/distributors/:id` | إنشاء/تعديل. |
| POST | `/distributors/:id/activate` \| `/distributors/:id/deactivate` | تفعيل/تعطيل. |

### Sales — `sales.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/sales` | قائمة فواتير بفلاتر (تاريخ، موزع، حالة الدفع، ترتيب...). |
| GET | `/sales/:id` | تفاصيل فاتورة (بنود + مدفوعات + المدفوع/المتبقي المحسوبان). |
| POST | `/sales` | إنشاء فاتورة (FIFO + دفعة أولية اختيارية) — transaction واحدة. |
| POST | `/sales/:id/cancel` | إلغاء فاتورة (سبب إلزامي؛ إرجاع مخزون + عكس دفعات). |
| PATCH | `/sales/:id` | تعديل بنود/ملاحظات الفاتورة (إعادة تخصيص FIFO). |

### Payments — `payments.controller.ts` (مسارات مركّبة)

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/sales/:saleId/payments` | دفعات فاتورة (بفلتر status). |
| POST | `/sales/:saleId/payments` | تسجيل دفعة (حماية من الدفع الزائد Overpayment + حركة نقدية IN). |
| PATCH | `/payments/:id` | تعديل دفعة (مع تعديل الحركة النقدية المرتبطة). |
| POST | `/payments/:id/reverse` | عكس دفعة (سبب إلزامي → REVERSED + حركة `SALE_PAYMENT_REVERSAL` OUT). |

### Lines — `lines.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/lines` · `/lines/:id` | قائمة/تفاصيل خط. |
| POST | `/lines` · PATCH `/lines/:id` | إنشاء/تعديل. |
| POST | `/lines/:id/activate` \| `/lines/:id/deactivate` | تفعيل/تعطيل. |
| DELETE | `/lines/:id` | حذف خط (مسموح فقط بلا مدفوعات مرتبطة). |

### Line Payments — `line-payments.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/lines/:lineId/payments` | دفعات خط (بفلتر status). |
| POST | `/lines/:lineId/payments` | تسجيل دفع خط (amount + period + حركة نقدية OUT). |
| POST | `/line-payments/:id/reverse` | عكس دفع خط → REVERSED + حركة `LINE_PAYMENT_REVERSAL` IN. |

### Expenses — `expenses.controller.ts` + `expense-categories.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/expenses` · `/expenses/:id` | قائمة (بفلاتر status/تصنيف/تاريخ + ترتيب) وتفاصيل. |
| POST | `/expenses` · PATCH `/expenses/:id` | إنشاء/تعديل (+ حركة نقدية OUT). |
| POST | `/expenses/:id/reverse` | عكس → REVERSED + `EXPENSE_REVERSAL` IN. |
| GET/POST/PATCH/DELETE | `/expense-categories...` (+ activate/deactivate) | إدارة التصنيفات. |

### Owner Withdrawals — `owner-withdrawals.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/owner-withdrawals` · `/owner-withdrawals/:id` | قائمة (بفلاتر/ترتيب)/تفاصيل. |
| POST | `/owner-withdrawals` · PATCH `/owner-withdrawals/:id` | إنشاء/تعديل (سبب إلزامي، حركة OUT). |
| POST | `/owner-withdrawals/:id/reverse` | عكس → REVERSED + `OWNER_WITHDRAWAL_REVERSAL` IN. |

### Cash — `cash.controller.ts`

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/cash/balance` | رصيد الصندوق (SUM IN − SUM OUT). |
| GET | `/cash/movements` | حركات بفلاتر (sourceType، direction، تاريخ) + صفحات. |
| POST | `/cash/manual-in` \| `/cash/manual-out` | حركة يدوية (sourceType = MANUAL). |

### Reports — `reports.controller.ts`

| Method | Endpoint | الفلاتر (Query) |
|---|---|---|
| GET | `/reports/sales` | dateFrom, dateTo, distributorId, packageId, status (ACTIVE/CANCELLED) |
| GET | `/reports/cash` | dateFrom, dateTo |
| GET | `/reports/inventory` | — (وضع المخزون الحالي) |
| GET | `/reports/distributors` | — (أرصدة الموزعين) |
| GET | `/reports/expenses` | dateFrom, dateTo, categoryId |
| GET | `/reports/lines` | — |
| GET | `/reports/collections` | dateFrom, dateTo (التحصيلات) |
| GET | `/reports/owner-withdrawals` | dateFrom, dateTo |

### أخرى

| Method | Endpoint | الوصف |
|---|---|---|
| GET | 🔓 `/health` | فحص جاهزية (`{"status":"ok","database":"ok"}`). |
| GET | `/dashboard` | بيانات لوحة التحكم (ملخص مالي + ديون + مخزون منخفض + أحدث العمليات + الباقات الأكثر مبيعًا). |
| GET | `/search?q=` | بحث شامل. |
| GET | `/audit-logs` · `/audit-logs/:id` | سجل التدقيق بفلاتر (action, entityType, userId, dateFrom, dateTo) + صفحات، وتفاصيل كل سجل. |
| GET/POST | `/backups` · GET `/backups/:id/download` · DELETE `/backups` (حذف الكل) · DELETE `/backups/:id` · POST `/backups/:id/restore` | نظام النسخ الداخلي — انظر §19. |
| GET/PATCH | `/settings` | الإعدادات (Singleton). |

---

## 7. شرح جميع الخدمات (Domains)

1. **Packages:** كتالوج الباقات المباعة. السعر هنا هو سعر البيع المرجعي؛ سعر التكلفة الفعلي يأتي من دفعات المخزون (شِدة FIFO). لا تُحذف باقة عليها مبيعات (`onDelete: Restrict`) — تُعطّل.
2. **Inventory:** نظام دفعات (PackageStock: packageId + unitPrice + receivedAt) وسجل حركات (InventoryMovement: ADD/SELL/RETURN/ADJUSTMENT مع quantityDelta موجب/سالب). **المخزون الحالي = SUM(quantity_delta)** لكل دفعة — لا يوجد رصيد مخزّن. الحذف الفعلي مسموح فقط للدفعات غير المستخدمة.
3. **Distributors:** بيانات الموزعين. **الرصيد = SUM(sales ACTIVE) − SUM(payments ACTIVE)** — محسوب دائمًا. التفعيل/التعطيل يحجب البيع للموزع دون حذف تاريخه.
4. **Sales:** فاتورة (invoiceNumber فريد تلقائي، distributorId، totalAmount، status ACTIVE/CANCELLED، saleDate، ملاحظات، بيانات الإلغاء). البنود (SaleItem) تحمل **لقطات تاريخية** (packageNameSnapshot + unitPrice + totalPrice) — الفاتورة لا تتأثر بتغيير الباقة لاحقًا. الإلغاء يعيد المخزون ويعكس الدفعات، ولا يمكن حذف فاتورة أبدًا.
5. **Payments:** دفعة موزع ضد فاتورة. حماية Overpayment: مجموع الدفعات النشطة لا يتجاوز `totalAmount`. التعديل يعدّل الحركة النقدية المرتبطة. العكس يبقي السجل بحالة REVERSED مع reversedAt/By/Reason.
6. **Cash:** ledger مركزي (direction IN/OUT + sourceType + sourceId polymorphic بدون FK + movementDate). **الرصيد دائمًا مشتق.** Manual In/Out للمصادر اليدوية (رصيد افتتاحي، فرق صندوق...).
7. **Lines:** خطوط الإنترنت التي يشتريها المشروع من مزودين (cost شهرية). يمكن حذف الخط فعليًا فقط إن لم تكن له مدفوعات.
8. **Line Payments:** دفع اشتراك خط لفترة (period نصي مثل "2026-10") — مصروف تشغيلي يخرج من الصندوق، قابل للعكس.
9. **Expense Categories:** تصنيفات للمصروفات (اسم فريد، isActive). قابلة للحذف الفعلي إن لم تستخدم.
10. **Expenses:** مصروف مع تصنيف ومبلغ ووصف وتاريخ. قابل للعكس (REVERSED + حركة نقدية عكسية).
11. **Owner Withdrawals:** سحب مالك من الصندوق (سبب إلزامي). قابل للعكس بنفس الآلية.
12. **Reports:** استعلامات تجميعية عبر نفس القواعد (استثناء REVERSED/CANCELLED من الإجماليات المالية حسب التقرير).
13. **Search:** بحث موحّد عبر الكيانات الرئيسية.
14. **Audit Logs:** كل عملية حساسة تسجّل AuditLog (action من enum AuditAction + entityType/entityId + oldValues/newValues JSONB + IP + UserAgent + user). القراءة بفلاتر وصفحات.
15. **Backup/Restore:** نسخ JSON snapshot داخلية — §19.
16. **Settings:** سجل Singleton (`singletonKey="main"`) لاسم الشبكة، العملة، البريد الإداري الظاهر في الفواتير، حد المخزون المنخفض.
17. **Authentication:** §9.

---

## 8. قواعد العمل والمنطق المالي بالتفصيل

هذه القواعد الثابتة موثقة في رأس `apps/api/prisma/schema.prisma` ومنفذة في الكود:

1. **لا توجد قيم مالية مخزنة قابلة للتناقض:**
   - `paidAmount`/`remainingAmount` لفاتورة = تُحسب من `SUM(payments WHERE status='ACTIVE')`.
   - المخزون الحالي = `SUM(inventory_movements.quantity_delta)` لكل packageStockId.
   - رصيد الصندوق = `SUM(IN) − SUM(OUT)` من `cash_movements`.
   - رصيد موزع = `SUM(ACTIVE sales) − SUM(ACTIVE payments)`.
2. **FIFO عند البيع** (`apps/api/src/sales/helpers/fifo.helper.ts`):
   - `SaleItem` لا يحمل packageStockId؛ الواجهة الخلفية توزع الكمية على دفعات `PackageStock` بترتيب `receivedAt ASC, createdAt ASC, id ASC`.
   - لكل دفعة مستخدمة تُنشأ `InventoryMovement` من نوع SELL.
   - **إجمالي الفاتورة يُحسب من أسعار الدفعات المخصصة** (سعر الشِدة)، لا من سعر الباقة.
   - تنفيذ كامل داخل **transaction واحدة** (فشل أي خطوة = rollback كامل).
   - **دمج البنود المكررة:** إن كرّر المستخدم نفس الباقة في الفاتورة، تُدمج البنود قبل تخصيص FIFO لمنع التخصيص المزدوج.
3. **منع الحذف المالي:** جميع العلاقات المالية `onDelete: Restrict`. لا يوجد مسار حذف لأي سجل مالي — التصحيح يكون بـ **REVERSED**:
   - `status = REVERSED` + `reversedAt` + `reversedBy` + `reversalReason` (سبب إلزامي).
   - تُنشأ حركة نقدية عكسية (`SALE_PAYMENT_REVERSAL`, `EXPENSE_REVERSAL`, `LINE_PAYMENT_REVERSAL`, `OWNER_WITHDRAWAL_REVERSAL`).
   - يسجّل AuditLog مطابق (PAYMENT_REVERSED, EXPENSE_REVERSED...).
   - السجل المعكوس **يبقى مرئيًا** في القوائم (بفلتر status) لكنه مستثنى من كل الإجماليات المالية.
4. **إلغاء فاتورة (CANCELLED)** — ليس حذفًا: يحتاج سببًا، يعيد الكميات للمخزون (حركات RETURN)، يعكس الدفعات النشطة المرتبطة، ويُستثنى من أرصدة الموزعين والتقارير المالية.
5. **تعديل فاتورة (PATCH):** إعادة تخصيص FIFO كاملة للبنود الجديدة مع الحفاظ على القواعد أعلاه.
6. **المراجع polymorphic بدون FK:** `inventory_movements.reference_id` و `cash_movements.source_id` تشير منطقيًا (وليس بقيد FK) إلى الكيان المصدر (sale/payment/expense...) — لتسجيل الأثر دون قيود حذف.
7. **Settings Singleton:** `singletonKey` تفصيل DB داخلي لا يظهر في DTOs/API.
8. **Backup.sizeBytes** من نوع BigInt يُحوَّل إلى number في طبقة DTO.
9. **Settings.adminEmail** هو البريد الظاهر في الفواتير — منفصل عن `users.email` (بريد تسجيل الدخول).

### حسابات نقدية — أنواع المصادر (CashSourceType)

| المصدر | الحركة الناتجة |
|---|---|
| OPENING | رصيد افتتاحي (يدوي) |
| SALE_PAYMENT | IN — دفعة موزع |
| SALE_PAYMENT_REVERSAL | OUT — عكس دفعة موزع |
| EXPENSE | OUT — مصروف |
| EXPENSE_REVERSAL | IN — عكس مصروف |
| LINE_PAYMENT | OUT — دفع اشتراك خط |
| LINE_PAYMENT_REVERSAL | IN — عكس دفع خط |
| OWNER_WITHDRAWAL | OUT — سحب مالك |
| OWNER_WITHDRAWAL_REVERSAL | IN — عكس سحب |
| MANUAL | IN/OUT — حركة يدوية |

---

## 9. آلية Authentication وJWT وCSRF

- **الجلسة:** JWT موقّع (`@nestjs/jwt`) يُحفظ في **HttpOnly Cookie** اسمها `prince_net_token` (قابل للتهيئة عبر `JWT_COOKIE_NAME`)، صلاحية 7 أيام (`JWT_EXPIRES_IN`).
- **كلمات المرور:** تجزئة **Argon2** عبر `@node-rs/argon2`.
- **إبطال الجلسات:** لكل مستخدم `tokenVersion` (migration منفصلة). عند logout أو تغيير كلمة المرور يُرفَع العدّاد، وكل JWT قديم يصبح غير صالح.
- **الحماية العامة:** `JwtAuthGuard` مسجّل كـ `APP_GUARD` عام — كل المسارات محمية افتراضيًا؛ الاستثناء بديكوريتور `@Public()` (مطبق على: `GET /auth/csrf`, `POST /auth/login`, `GET /health`).
- **CSRF:** حماية **double-submit cookie** بمكتبة `csrf-csrf`: الواجهة تجلب token من `GET /auth/csrf` (يضبط cookie `prince_net_csrf`) وترسله مع كل طلب تغيير برأس `x-csrf-token`. الطلبات بدون/بخاطئ token تُرفض.
- **Rate limiting:** `@nestjs/throttler` عام — افتراضيًا 120 طلب/60 ثانية (`RATE_LIMIT_TTL`/`RATE_LIMIT_MAX`).
- **رؤوس أمان:** `helmet` على كل الاستجابات.
- **CORS:** أصل واحد فقط (`CORS_ORIGIN`) مع `credentials: true` لدعم cookies.
- **التحقق من البيانات:** ValidationPipe عام (`whitelist + forbidNonWhitelisted`) + `ZodValidationPipe` بسكيماس مشتركة من `@prince-net/validation` (نفس السكيما تُستخدم في الواجهة عبر react-hook-form + zodResolver).
- **Audit:** LOGIN / LOGIN_FAILED / PASSWORD_CHANGED تُسجَّل تلقائيًا.

**الصلاحيات:** النظام حاليًا أحادي المستخدم (Admin واحد من الـ seed). لا يوجد نظام أدوار متعدد — كل مستخدم مصادق له كل الصلاحيات.

---

## 10. التقنيات والمكتبات والإصدارات الفعلية

(من `package.json` لكل حزمة — القيم المثبتة في `pnpm-lock.yaml`)

### التشغيل

| التقنية | الإصدار (range المثبّت) |
|---|---|
| Node.js | >= 22.13.0 (engines) — تشغيل فعلي: Node 22 |
| pnpm | 11.28.0 (packageManager) |
| PostgreSQL | 16 (صورة `postgres:16-bookworm` في compose) |

### API (`apps/api`)

| المكتبة | الإصدار |
|---|---|
| @nestjs/common, core, platform-express | ^11.2.7 (NestJS 11, Express 5) |
| @nestjs/config | ^4.0.4 |
| @nestjs/jwt | ^11.0.2 |
| @nestjs/passport + passport + passport-jwt | ^11.0.5 / ^0.7.0 / ^4.0.1 |
| @nestjs/throttler | ^6.7.1 |
| @prisma/client + prisma + @prisma/adapter-pg | ^6.19.3 (Prisma 6.19) |
| @node-rs/argon2 | ^2.2.1 |
| csrf-csrf | ^4.0.3 |
| helmet | ^8.3.0 |
| cookie-parser | ^1.4.7 |
| zod | ^3.25.76 |
| class-validator / class-transformer | ^0.14.4 / ^0.5.1 |
| TypeScript | ^5.9.3 |
| ESLint | ^8.57.1 (8) |
| Jest / ts-jest | ^29.7 / ^29.4 |
| tsx (تشغيل الـ seed) | ^4.23.15 |

### Web (`apps/web`)

| المكتبة | الإصدار |
|---|---|
| react / react-dom | ^18.3.1 (React 18) |
| vite | ^7.3.6 (Vite 7) |
| @vitejs/plugin-react | ^5.2.0 |
| react-router-dom | ^6.30.6 |
| @tanstack/react-query | ^5.104.1 |
| react-hook-form + @hookform/resolvers | ^7.89.0 + ^3.10.0 |
| tailwindcss | ^3.4.19 (3) + tailwind-merge + tailwindcss-animate |
| Radix UI (dialog, select, table, tabs, toast...) | 1.x / 2.x |
| lucide-react | ^0.451.0 |
| date-fns | ^4.4.0 |
| react-day-picker | ^9.14.0 |
| jspdf | ^4.2.1 |
| html2canvas-pro | ^2.5.0 |
| zod | ^3.25.76 |

### حزم مُدارة بمسارات workspace

`@prince-net/types`, `@prince-net/validation`, `@prince-net/config` — جميعها `workspace:*` و CJS تُبنى إلى `dist/`.

> ⚠️ قرارات الإصدارات (من صيانة أكتوبر 2026): **متعمد عدم الترقية** إلى: Prisma 7، Tailwind 4، ESLint 9+، React 19، zod 4، react-router 7 — لوجود كسر توافق معروف.

---

## 11. هيكل المشروع والمجلدات

```
prince-net/
├── package.json                  # سكربتات الجذر (dev, build, prisma:*, typecheck...)
├── pnpm-workspace.yaml           # apps/* + packages/*
├── pnpm-lock.yaml
├── tsconfig.json                 # tsconfig الجذر المشتق منه
├── .env.example                  # قالب متغيرات البيئة (بدون قيم حقيقية)
├── .env.base44-defaults          # قيم افتراضية للتشغيل في Base44 (ملموسة في compose)
├── Dockerfile.base44             # صورة Node 22 للتشغيل داخل compose
├── docker-compose.base44.yml     # بيئة التطوير الكاملة (db + migrate + api + web)
├── AGENTS.md                     # ملاحظات بيئة التطوير في Base44
├── README.md                     # نظرة عامة على الميزات
├── docs/                         # api.md, architecture.md, business-rules.md,
│                                 # database.md, audit-log-improvements.md
├── PROJECT_DOCUMENTATION.md      # ← هذا الملف
├── packages/
│   ├── types/                    # كل أنواع TypeScript المشتركة (DTO shapes)
│   ├── validation/               # سكيماس Zod المشتركة (front + back)
│   └── config/                   # ثوابت مشتركة (API_PREFIX, COOKIE_NAMES...)
│       src/{constants.ts, defaults.ts, index.ts}
│       # defaults.ts: DEFAULT_PACKAGES (باقات الـ seed) + DEFAULT_SETTINGS
├── apps/
│   ├── api/                      # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # 554 سطرًا — المصدر الرسمي لبنية DB
│   │   │   ├── migrations/        # 5 migrations (§14)
│   │   │   └── seed.ts            # Admin + Packages + Settings
│   │   ├── src/                   # (المخطط في §5)
│   │   │   └── generated/prisma/  # Prisma client مولَّد (gitignored)
│   │   └── .env                   # بيئة محلية (gitignored) — §25
│   └── web/                       # React SPA (المخطط في §5)
│       └── vite.config.ts         # بروكسي /api + aliases للمجلدات packages/*/src
└── .base44/environment.json       # ميتاداتا بيئة Base44 (ports, secrets names)
```

---

## 12. pnpm Workspace والـ Shared Packages

- `pnpm-workspace.yaml` يعرّف workspace بـ `apps/*` و`packages/*`.
- الحزم الثلاث المشتركة تُستهلك بـ `"workspace:*"` من API وWeb معًا:
  - **`@prince-net/types`** — أنواع TypeScript لكل المجالات (sale, payment, cash, backup, audit, report, search, settings, dashboard...). تجمع كلاً من `src/*.ts` عبر `index.ts`.
  - **`@prince-net/validation`** — سكيماس Zod لكل المدخلات. تُستخدم في API عبر `ZodValidationPipe` وفي Web عبر `zodResolver` مع react-hook-form — **مصدر تحقق واحد** للطرفين.
  - **`@prince-net/config`** — ثوابت browser-safe: `API_PREFIX`، `DEFAULT_PAGE_LIMIT`/`MAX_PAGE_LIMIT`، `COOKIE_NAMES`، `HEADERS.CSRF`، `AUDIT_ACTIONS`، و`DEFAULT_PACKAGES`/`DEFAULT_SETTINGS` المستخدمة في الـ seed.
- **الحزم CJS تُبنى إلى `dist/`** — يجب تنفيذ `pnpm build:packages` قبل تشغيل API أو الـ seed. أما Web فتستخدم aliases إلى `packages/*/src` مباشرة (بدون build) — انظر `apps/web/vite.config.ts`.
- تشغيل الأوامر من **جذر الـ workspace فقط** (مثل `pnpm --filter @prince-net/api dev`).

---

## 13. توثيق قاعدة البيانات بالكامل

**DBMS:** PostgreSQL 16 · **القاعدة:** `prince_net` · **الـ Schema:** `public` · **المفاتيح:** UUID (`@db.Uuid`) · **المال:** `NUMERIC(12,2)` · **التواريخ:** `TIMESTAMPTZ(6)`.

> المصدر الرسمي الكامل: `apps/api/prisma/schema.prisma` (554 سطرًا). كل ما يلي منه مباشرة.

### الـ Enums

| Enum | القيم |
|---|---|
| EntityStatus | ACTIVE, INACTIVE |
| SaleStatus | ACTIVE, CANCELLED |
| PaymentStatus | ACTIVE, REVERSED |
| LinePaymentStatus | ACTIVE, REVERSED |
| ExpenseStatus | ACTIVE, REVERSED |
| OwnerWithdrawalStatus | ACTIVE, REVERSED |
| InventoryMovementType | ADD, SELL, RETURN, ADJUSTMENT |
| CashDirection | IN, OUT |
| CashSourceType | OPENING, SALE_PAYMENT, SALE_PAYMENT_REVERSAL, EXPENSE, EXPENSE_REVERSAL, LINE_PAYMENT, LINE_PAYMENT_REVERSAL, OWNER_WITHDRAWAL, OWNER_WITHDRAWAL_REVERSAL, MANUAL |
| AuditAction | LOGIN, LOGIN_FAILED, PACKAGE_*, INVENTORY_*, DISTRIBUTOR_*, SALE_*, PAYMENT_*, LINE_*, LINE_PAYMENT_*, EXPENSE_*, EXPENSE_CATEGORY_*, OWNER_WITHDRAWAL_*, CASH_MANUAL_IN/OUT, BACKUP_*, SETTINGS_UPDATED, PASSWORD_CHANGED (القائمة الكاملة في schema.prisma) |

### الجداول (17)

#### 1. `users`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | default uuid |
| email | TEXT | **UNIQUE** — بريد تسجيل الدخول |
| password_hash | TEXT | Argon2 |
| token_version | INT | default 0 — لإبطال JWTs |
| created_at / updated_at | TIMESTAMPTZ | |

علاقات: يُنشئ/يعكس كل الكيانات المالية + auditLogs + backups (كلها Restrict).

#### 2. `packages`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| name | TEXT | **UNIQUE** |
| price | NUMERIC(12,2) | سعر البيع المرجعي |
| data_size_mb / hours | INT | |
| color / description | TEXT? | |
| status | EntityStatus | default ACTIVE — **@@index([status])** |
| created_at / updated_at | TIMESTAMPTZ | |

#### 3. `package_stocks` (دفعات المخزون)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| package_id | UUID FK→packages | **Restrict** |
| unit_price | NUMERIC(12,2) | سعر شراء الوحدة لهذه الدفعة |
| received_at | TIMESTAMPTZ | أساس ترتيب FIFO — **@@index** |
| notes | TEXT? | |
| created_by | UUID FK→users | **Restrict** |

فهارس: `[packageId]`, `[receivedAt]`, `[createdAt]`.

#### 4. `inventory_movements` (سجل حركة المخزون — الـ Ledger)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| package_stock_id | UUID FK→package_stocks | **Restrict** |
| type | InventoryMovementType | ADD/SELL/RETURN/ADJUSTMENT |
| quantity_delta | INT | موجب للإضافة وسالب للخصم |
| unit_price | NUMERIC(12,2) | سعر الوحدة عند الحركة |
| reference_type / reference_id | TEXT? / UUID? | مرجع polymorphic **بدون FK** — **@@index([referenceType, referenceId])** |
| description | TEXT? | |
| created_by | UUID FK→users | **Restrict** |

فهارس: `[packageStockId]`, `[type]`, `[createdAt]`.

#### 5. `distributors`
id, name, phone, address?, notes?, status (EntityStatus, @@index), registration_date, created_at, updated_at. فهارس: `[name]`, `[phone]`, `[status]`.

#### 6. `sales`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| invoice_number | TEXT | **UNIQUE** (توليد تلقائي — `invoice-number.helper.ts`) |
| distributor_id | UUID FK→distributors | **Restrict** — @@index |
| total_amount | NUMERIC(12,2) | من أسعار FIFO |
| status | SaleStatus | ACTIVE/CANCELLED — @@index |
| sale_date | TIMESTAMPTZ | @@index |
| notes | TEXT? | |
| created_by / cancelled_by | UUID FK→users | **Restrict** |
| cancelled_at / cancellation_reason | TIMESTAMPTZ? / TEXT? | بيانات الإلغاء |

#### 7. `sale_items`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| sale_id | UUID FK→sales | **Restrict** — @@index |
| package_id | UUID FK→packages | **Restrict** — @@index |
| package_name_snapshot | TEXT | **لقطة تاريخية لاسم الباقة** |
| quantity | INT | |
| unit_price / total_price | NUMERIC(12,2) | **لقطة تاريخية للسعر** |

#### 8. `payments`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| sale_id | UUID FK→sales | **Restrict** — @@index |
| amount | NUMERIC(12,2) | |
| status | PaymentStatus | ACTIVE/REVERSED — @@index |
| payment_date | TIMESTAMPTZ | @@index |
| notes | TEXT? | |
| created_by / reversed_by | UUID FK→users | **Restrict** |
| reversed_at / reversal_reason | TIMESTAMPTZ? / TEXT? | |

#### 9. `lines`
id, name, provider, identifier (@@index), speed?, cost NUMERIC(12,2), status (@@index), subscription_date, notes?, created_at, updated_at.

#### 10. `line_payments`
id, line_id FK→lines (**Restrict**, @@index), amount NUMERIC(12,2), **period** TEXT (الفترة مثل `2026-10`), status (LinePaymentStatus, @@index), payment_date (@@index), notes?, created_by/reversed_by FK→users, reversed_at/reversal_reason.

#### 11. `expense_categories`
id, name **UNIQUE**, description?, is_active BOOLEAN default true, created_at, updated_at.

#### 12. `expenses`
id, category_id FK→expense_categories (**Restrict**, @@index), description TEXT, amount NUMERIC(12,2), status (ExpenseStatus, @@index), expense_date (@@index), notes?, created_by/reversed_by FK→users, reversed_at/reversal_reason.

#### 13. `owner_withdrawals`
id, amount NUMERIC(12,2), reason TEXT **(إلزامي)**, status (OwnerWithdrawalStatus, @@index), withdrawal_date (@@index), notes?, created_by/reversed_by FK→users, reversed_at/reversal_reason.

#### 14. `cash_movements` (سجل النقد — الـ Ledger)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| direction | CashDirection | IN/OUT — @@index |
| amount | NUMERIC(12,2) | |
| source_type | CashSourceType | @@index + @@index([source_type, source_id]) |
| source_id | UUID? | مرجع polymorphic **بدون FK** |
| description | TEXT? | |
| movement_date | TIMESTAMPTZ | @@index |
| created_by | UUID FK→users | **Restrict** |

#### 15. `audit_logs`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK→users | **Restrict** |
| action | AuditAction | @@index |
| entity_type | TEXT | @@index([entity_type, entity_id]) |
| entity_id | UUID? | |
| old_values / new_values | JSONB? | القيم قبل/بعد |
| ip_address / user_agent | TEXT? | |
| created_at | TIMESTAMPTZ | @@index |

#### 16. `backups`
id, file_name, storage_path, size_bytes **BigInt** (يُحوَّل number في DTO), record_count INT, checksum TEXT, created_by FK→users (**Restrict**), created_at (@@index).

#### 17. `settings` (Singleton)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| singleton_key | TEXT | **UNIQUE default "main"** — ضمان سجل واحد (تفصيل داخلي لا يظهر في API) |
| network_name / currency_name / currency_symbol | TEXT | |
| admin_email | TEXT | البريد الإداري الظاهر في الفواتير (≠ بريد تسجيل الدخول) |
| low_stock_threshold | INT | default 10 |
| created_at / updated_at | TIMESTAMPTZ | |

### إعادة إنشاء بنية قاعدة البيانات من الصفر

المصدر الرسمي هو `apps/api/prisma/schema.prisma` — بنية كاملة تُنشأ بأمر واحد:

```bash
# من جذر المشروع — يحتاج DATABASE_URL فقط
pnpm prisma:generate                          # توليد Prisma Client
pnpm --filter @prince-net/api exec prisma migrate deploy   # إنشاء كل الجداول والفهارس
pnpm prisma:seed                              # Admin + الباقات الافتراضية + Settings
```

أو لتوليد SQL كامل من الـ Schema (بدون تطبيق):

```bash
cd apps/api
pnpm exec prisma migrate diff \
  --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
```

---

## 14. الـ Migrations وترتيبها والغرض منها

مجلد `apps/api/prisma/migrations/` — تُطبَّق بترتيب أسمائها الزمني عبر `prisma migrate deploy`:

| # | الاسم | الغرض |
|---|---|---|
| 1 | `20260930171324_init` | **البنية الأولية الكاملة:** كل الـ enums (EntityStatus, SaleStatus, PaymentStatus, LinePaymentStatus, ExpenseStatus, OwnerWithdrawalStatus, InventoryMovementType, CashDirection, CashSourceType, AuditAction) + كل الجداول الـ 17 + الفهارس + قيود FK (Restrict). |
| 2 | `20261001000000_add_user_token_version` | إضافة `users.token_version` — آلية إبطال كل JWTs عند logout/تغيير كلمة المرور. |
| 3 | `20261002000000_add_new_audit_actions` | إضافة قيم AuditAction جديدة للـ enum. |
| 4 | `20261003072000_sync_audit_action` | مزامنة enum `AuditAction` في DB مع القائمة في `packages/config` (والسكيما). |
| 5 | `20261003192547_add_backup_audit_actions` | إضافة قيم Backup (BACKUP_CREATED, BACKUP_RESTORED, BACKUP_EXPORTED, BACKUP_DELETED, BACKUPS_PURGED) إلى enum AuditAction. |

التحقق من الحالة:

```bash
docker compose -f docker-compose.base44.yml exec -T db \
  psql -U prince_net -d prince_net -c 'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY migration_name;'
```

---

## 15. Database From Scratch — إنشاء قاعدة جديدة كاملة

### الخطوة 1: إنشاء مستخدم وقاعدة PostgreSQL

```sql
-- psql كـ superuser (مثال: psql -U postgres)
CREATE USER prince_net WITH PASSWORD 'اختر-كلمة-مرور-قوية';
CREATE DATABASE prince_net OWNER prince_net;
-- قاعدة الظل — مطلوبة فقط لتطوير الـ migrations (prisma migrate dev)
CREATE DATABASE prince_net_shadow OWNER prince_net;
GRANT ALL PRIVILEGES ON DATABASE prince_net TO prince_net;
GRANT ALL PRIVILEGES ON DATABASE prince_net_shadow TO prince_net;
```

> في بيئة Base44 الدوكرية: المستخدم/القاعدة `prince_net` ينشئان تلقائيًا من `POSTGRES_USER`/`POSTGRES_DB` في `docker-compose.base44.yml`، والقاعدة الظل `prince_net_shadow` أُنشئت يدويًا داخل حاوية `db`.

### الخطوة 2: ملف البيئة

```bash
# apps/api/.env  (محليًا) — أو صدّرها كمتغيرات بيئة
DATABASE_URL="postgresql://prince_net:كلمة-المرور@localhost:5432/prince_net?schema=public"
JWT_SECRET="سلسلة-عشوائية-32-حرفًا-على-الأقل"
CSRF_SECRET="سلسلة-عشوائية-16-حرفًا-على-الأقل"
CORS_ORIGIN="http://localhost:5173"
BACKUP_DIR="/مسار/مطلق/للنسخ/الاحتياطية"   # يجب أن يكون مسارًا مطلقًا
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="كلمة-مرور-قوية-12-حرفًا-على-الأقل"   # يستخدمها الـ seed فقط
```

### الخطوة 3: توليد البنية والبيانات الأولية

```bash
# من جذر المشروع
pnpm install                       # تثبيت كل الـ workspace
pnpm build:packages                # بناء الحزم المشتركة (شرط لعمل API وseed)
pnpm prisma:generate               # توليد Prisma Client
pnpm prisma:migrate                # prisma migrate dev — ينشئ/يطبق migrations (تطوير)
# أو للإنتاج/قاعدة جاهزة:
pnpm prisma:deploy                 # prisma migrate deploy — يطبق migrations الموجودة فقط
pnpm prisma:seed                   # إنشاء Admin + الباقات الافتراضية + Settings
```

بعد هذه الخطوات تكون القاعدة جاهزة للعمل بالكامل.

---

## 16. النسخ الاحتياطي الخارجي (pg_dump / pg_restore) ونقل قاعدة البيانات

> ⚠️ شغّل هذه الأوامر على الخادم/الجهاز الذي فيه PostgreSQL. في بيئة Base44 استخدم `docker compose -f docker-compose.base44.yml exec -T db ...`.

### نسخة كاملة (تنسيق custom — موصى بها للنسخ والاستعادة)

```bash
# نسخ احتياطي
pg_dump -U prince_net -d prince_net -F c -f prince_net_backup_$(date +%Y%m%d_%H%M%S).dump

# استعادة إلى قاعدة (فارغة أو موجودة)
createdb -U prince_net prince_net_new
pg_restore -U prince_net -d prince_net_new --clean --if-exists prince_net_backup_YYYYMMDD_HHMMSS.dump
```

### نسخة SQL نصية (قابلة للقراءة/التعديل)

```bash
pg_dump -U prince_net -d prince_net -F p > prince_net_backup.sql

# الاستعادة
psql -U prince_net -d prince_net_new < prince_net_backup.sql
```

### نسخ Schema فقط (بنية بلا بيانات)

```bash
pg_dump -U prince_net -d prince_net --schema-only > prince_net_schema.sql
```

### النقل عبر الشبكة (جهاز/خادم آخر) دون ملف وسيط

```bash
# من الجهاز القديم → الجديد (يشمل Schema + Data)
pg_dump -U prince_net -d prince_net -F c | \
  ssh user@new-server "pg_restore -U prince_net -d prince_net --clean --if-exists"
```

### نسخ داخل بيئة Base44 (حاوية الدوكر)

```bash
# إلى ملف على الجهاز المضيف
docker compose -f docker-compose.base44.yml exec -T db \
  pg_dump -U prince_net -d prince_net -F c > backup.dump

# الاستعادة من ملف
docker compose -f docker-compose.base44.yml exec -T db \
  pg_restore -U prince_net -d prince_net --clean --if-exists < backup.dump
```

### نقاط مهمة عند النقل

- استعادة `--clean --if-exists` تُسقط الكائنات الموجودة أولًا — **تحذف بيانات القاعدة الهدف**. انسخها احتياطيًا أولًا إن كانت مهمة.
- `pg_dump` لا ينسخ مستخدمي PostgreSQL نفسهم — أوجد المستخدم (`CREATE USER`) في الهدف أولًا وعدّل `DATABASE_URL`.
- انتبه لإصدار `pg_dump`: استخدم أدوات إصدار PostgreSQL نفسه أو أحدث (16).
- هذا النسخ **مستقل تمامًا** عن نظام Backup/Restore الداخلي في التطبيق (§19) — الأخير يعمل من داخل الواجهة ويصدر JSON.

---

## 17. الفرق بين نقل Schema فقط / Schema + Data / المشروع كاملًا

| ماذا تنقل | ما تشمله | متى تستخدمه | النتيجة في الجهاز الجديد |
|---|---|---|---|
| **Schema فقط** | البنية (جداول، enums، فهارس، قيود) بلا بيانات | مشروع جديد بنفس البنية، بيئة اختبار | تحتاج `prisma migrate deploy` (أو استيراد `prince_net_schema.sql`) ثم **seed** لإنشاء Admin/الباقات/الإعدادات — بلا أي بيانات أعمال |
| **Schema + Data** | البنية + كل بيانات الأعمال (فواتير، مدفوعات، مخزون، سجلات تدقيق...) | نقل التشغيل إلى خادم/جهاز آخر بنفس القاعدة | `pg_dump` كامل ثم `pg_restore` — تنتقل كل الحسابات والأرصدة كما هي |
| **المشروع كاملًا** | الكود + الـ Schema + البيانات + ملفات البيئة | تسليم المشروع لمطور/نقله بالكامل | انسخ المستودع (git clone أو نسخ المجلد بدون `node_modules`/`dist`/`generated`) + نفّذ §20 (تشغيل محلي) أو §21 (دوكر) + وجّه `DATABASE_URL` إلى القاعدة المنقولة (Schema+Data) أو قاعدة جديدة (مع seed) |

> ملاحظة: مستخدمو PostgreSQL، كلمات المرور، وملفات `.env` **لا تنتقل** مع أي من الخيارات الثلاثة تلقائيًا — تُعد يدويًا في الجهاز الجديد (انظر §25).

---

## 18. استعلامات SQL لفحص سلامة البيانات

استعلامات جاهزة — شغّلها عبر psql (مثال Base44: `docker compose -f docker-compose.base44.yml exec -T db psql -U prince_net -d prince_net`).

```sql
-- 1) اتساق إجمالي الفواتير مع بنودها
--    (العمود الصحيح في sale_items هو total_price — لا يوجد line_total)
SELECT s.id, s.invoice_number
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
GROUP BY s.id, s.invoice_number, s.total_amount
HAVING SUM(si.total_price) <> s.total_amount;
-- النتيجة المتوقعة: 0 صفوف

-- 2) رصيد كل موزع (مبيعات نشطة - مدفوعات نشطة)
SELECT d.id, d.name,
  COALESCE((SELECT SUM(s.total_amount) FROM sales s
            WHERE s.distributor_id = d.id AND s.status = 'ACTIVE'), 0) AS sales_total,
  COALESCE((SELECT SUM(p.amount) FROM payments p
            JOIN sales s ON s.id = p.sale_id AND s.distributor_id = d.id
            WHERE p.status = 'ACTIVE'), 0) AS paid,
  COALESCE((SELECT SUM(s.total_amount) FROM sales s
            WHERE s.distributor_id = d.id AND s.status = 'ACTIVE'), 0)
  - COALESCE((SELECT SUM(p.amount) FROM payments p
            JOIN sales s ON s.id = p.sale_id AND s.distributor_id = d.id
            WHERE p.status = 'ACTIVE'), 0) AS balance
FROM distributors d
ORDER BY balance DESC;

-- 3) رصيد الصندوق الحالي
SELECT
  COALESCE(SUM(amount) FILTER (WHERE direction = 'IN'), 0)  AS total_in,
  COALESCE(SUM(amount) FILTER (WHERE direction = 'OUT'), 0) AS total_out,
  COALESCE(SUM(amount) FILTER (WHERE direction = 'IN'), 0)
  - COALESCE(SUM(amount) FILTER (WHERE direction = 'OUT'), 0) AS balance
FROM cash_movements;

-- 4) حركات نقدية معكوسة بدون حركة عكسية مقابلة (دفعات)
SELECT p.id
FROM payments p
WHERE p.status = 'REVERSED'
  AND NOT EXISTS (
    SELECT 1 FROM cash_movements cm
    WHERE cm.source_type = 'SALE_PAYMENT_REVERSAL' AND cm.source_id = p.id
  );

-- 5) دفعات تتجاوز قيمة فاتورتها (حماية Overpayment)
SELECT p.sale_id, SUM(p.amount) AS paid, s.total_amount
FROM payments p JOIN sales s ON s.id = p.sale_id
WHERE p.status = 'ACTIVE'
GROUP BY p.sale_id, s.total_amount
HAVING SUM(p.amount) > s.total_amount;

-- 6) المخزون الحالي لكل باقة (من الـ ledger)
SELECT pkg.name,
  COALESCE(SUM(im.quantity_delta), 0) AS current_stock
FROM packages pkg
LEFT JOIN package_stocks ps ON ps.package_id = pkg.id
LEFT JOIN inventory_movements im ON im.package_stock_id = ps.id
GROUP BY pkg.name
ORDER BY current_stock;

-- 7) عدد السجلات في كل الجداول (لمقارنة النسخ الاحتياطية)
SELECT 'users' t, COUNT(*) FROM users UNION ALL
SELECT 'packages', COUNT(*) FROM packages UNION ALL
SELECT 'package_stocks', COUNT(*) FROM package_stocks UNION ALL
SELECT 'inventory_movements', COUNT(*) FROM inventory_movements UNION ALL
SELECT 'distributors', COUNT(*) FROM distributors UNION ALL
SELECT 'sales', COUNT(*) FROM sales UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items UNION ALL
SELECT 'payments', COUNT(*) FROM payments UNION ALL
SELECT 'lines', COUNT(*) FROM lines UNION ALL
SELECT 'line_payments', COUNT(*) FROM line_payments UNION ALL
SELECT 'expense_categories', COUNT(*) FROM expense_categories UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses UNION ALL
SELECT 'owner_withdrawals', COUNT(*) FROM owner_withdrawals UNION ALL
SELECT 'cash_movements', COUNT(*) FROM cash_movements UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
```

---

## 19. نظام Backup/Restore الداخلي في التطبيق

(التنفيذ: `apps/api/src/backups/backups.service.ts` — الواجهة: `/backup`)

- **الصيغة:** JSON snapshot (إصدار `SNAPSHOT_VERSION = 1`) لكل بيانات الأعمال، يُخزَّن كملف في `BACKUP_DIR` (مسار مطلق إلزامي) ويسجَّل في جدول `backups` (اسم الملف، المسار، الحجم `size_bytes`، عدد السجلات `record_count`، checksum).
- **الجداول المنسوخة** (بالترتيب `INSERT_ORDER` — الأب قبل الابن لتبعيات FK): `packages, distributors, settings, packageStocks, sales, saleItems, payments, lines, linePayments, expenseCategories, expenses, ownerWithdrawals, inventoryMovements, cashMovements, auditLogs`.
- **عند الاستعادة:**
  1. تُحذف بيانات الجداول بالترتيب العكسي (`WIPE_ORDER` — الابن قبل الأب).
  2. يُعاد إدراج كل شيء من الـ snapshot.
  3. **جدول `backups` نفسه لا يُحذف** (يُحفظ تاريخ النسخ).
  4. **جدول `users` يُدمج بـ upsert (لا يُحذف)** — لأنه مرجع FK لـ backups ولأن جلسة المستخدم الحالي يجب أن تبقى صالحة بعد الاستعادة.
- **العمليات:** إنشاء نسخة (`POST /backups`)، تنزيل (`GET /backups/:id/download`)، استعادة (`POST /backups/:id/restore`)، حذف نسخة (`DELETE /backups/:id`)، حذف الكل (`DELETE /backups`).
- **التدقيق:** BACKUP_CREATED / BACKUP_RESTORED / BACKUP_EXPORTED / BACKUP_DELETED / BACKUPS_PURGED.
- **نسخة أسبوعية تلقائية:** مجدول `apps/api/src/scheduler/` (`@nestjs/schedule`) ينشئ نسخة كاملة تلقائيًا **كل يوم جمعة 00:00 UTC** (cron `0 0 * * 5`, timeZone `UTC`) وتُنسب إلى أقدم مستخدم (الأدمن). أي فشل يُسجَّل في logs ولا يوقف التطبيق.
- **تذكير الإغلاق الشهري:** سياسة الشهر = تذكير فقط (لا قفل ولا إغلاق تلقائي). طالما أن **آخر يوم من الشهر الماضي بدون إغلاق صندوق**، يظهر تنبيه `MONTHLY_CLOSING_REMINDER` في مركز التنبيهات (يُحسب عند الطلب — بدون تخزين)، ويختفي تلقائيًا بمجرد إغلاق ذلك اليوم يدويًا من `/cash`. (التنفيذ: `apps/api/src/notifications/notifications.service.ts`).
- **في بيئة Base44:** `BACKUP_DIR=/tmp/prince-net-backups` وهو volume باسم `backups` مُلحق بحاوية API (يستمر بين إعادة التشغيل).
- **حدود:** هذا النظام ينسخ **بيانات الأعمال** من/إلى نفس التطبيق — لا يُغني عن `pg_dump` الخارجي (الذي ينسخ أيضًا البنية ويصلح للنقل بين خوادم).

---

## 20. التشغيل محليًا على Windows من الصفر

### المتطلبات

- **Node.js ≥ 22.13** — من [nodejs.org](https://nodejs.org) (LTS الحالي كافٍ).
- **pnpm ≥ 11.28** — بعد تثبيت Node:
  ```powershell
  corepack enable
  corepack prepare pnpm@11.28.0 --activate
  # أو: npm install -g pnpm@11.28.0
  ```
- **PostgreSQL 16** — من [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (مع pgAdmin اختياري). تذكّر كلمة مرور المستخدم `postgres` التي تحددها أثناء التثبيت.

### الخطوات

```powershell
# 1) فتح المجلد
cd C:\path\to\prince-net

# 2) تثبيت الـ dependencies (كل الـ workspace)
pnpm install

# 3) إنشاء القاعدة والمستخدم (من psql)
#    psql -U postgres
CREATE USER prince_net WITH PASSWORD 'كلمة-مرور-قوية';
CREATE DATABASE prince_net OWNER prince_net;
CREATE DATABASE prince_net_shadow OWNER prince_net;
\q

# 4) ملف البيئة — انسخ القالب وعدّله
copy .env.example apps\api\.env
#   ثم حرّر apps\api\.env:
#   DATABASE_URL="postgresql://prince_net:كلمة-المرور@localhost:5432/prince_net?schema=public"
#   JWT_SECRET / CSRF_SECRET  ← سلاسل عشوائية (32+/16+ حرفًا)
#   CORS_ORIGIN="http://localhost:5173"
#   BACKUP_DIR="C:/prince-net-data/backups"     ← مسار مطلق، خارج أي web root
#   ADMIN_EMAIL / ADMIN_PASSWORD                ← للـ seed فقط (12+ حرفًا)

# 5) بناء الحزم المشتركة (شرط لعمل API والـ seed)
pnpm build:packages

# 6) Prisma
pnpm prisma:generate        # توليد الـ client
pnpm prisma:migrate         # إنشاء البنية (migrate dev — أول مرة يطبق كل الـ migrations)
pnpm prisma:seed            # Admin + 5 باقات افتراضية + Settings

# 7) تشغيل API (منفذ 3000 افتراضيًا محليًا — PORT في .env)
pnpm --filter @prince-net/api dev        # nest start --watch → http://localhost:3000/api/v1

# 8) تشغيل الواجهة (نافذة ثانية)
pnpm --filter @prince-net/web dev        # vite → http://localhost:5173
```

- الواجهة تبروكسي `/api` إلى `http://localhost:3000` افتراضيًا (`API_PROXY_TARGET`) — نفس منفذ API المحلي، فلا تعديل مطلوب.
- الدخول: `http://localhost:5173` → البريد/كلمة المرور من `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- للتحقق: `curl http://localhost:3000/api/v1/health` → `{"status":"ok","database":"ok"}`.

---

## 21. التشغيل باستخدام Docker (docker-compose.base44.yml)

```powershell
# من جذر المشروع — يبني الصور ويشغل كل الخدمات
docker compose -f docker-compose.base44.yml up -d --build

# الحالة
docker compose -f docker-compose.base44.yml ps

# متابعة السجلات
docker compose -f docker-compose.base44.yml logs -f api
```

### الخدمات الأربع

| الخدمة | الصورة/الأمر | الوصف |
|---|---|---|
| `db` | `postgres:16-bookworm` | قاعدة `prince_net` (المستخدم `prince_net` من متغيرات compose). healthcheck: `pg_isready`. |
| `migrate` | `Dockerfile.base44` (Node 22) | **خدمة لمرة واحدة (one-shot):** `pnpm build:packages && pnpm prisma:generate && pnpm prisma:deploy && pnpm prisma:seed` ثم تخرج. شرط بدء API. |
| `api` | نفس الصورة | `pnpm --filter @prince-net/api dev` (nest watch) على المنفذ الداخلي **3001**. healthcheck: `curl http://localhost:3001/api/v1/health`. |
| `web` | نفس الصورة | `pnpm --filter @prince-net/web dev` على **5173** → مضيف **3000**. بروكسي `/api` → `API_PROXY_TARGET=http://api:3001`. |

- **المصدر مُلحق (bind mount)** عند `/app` — التعديلات تنعكس مباشرة (dev servers بـ watch).
- node_modules كل حزمة في **volumes منفصلة** (`node_modules`, `api_node_modules`, `web_node_modules`, `pkg_*`).
- **الترتيب:** `db (healthy) → migrate (completed) → api (healthy) → web`.
- إيقاف: `docker compose -f docker-compose.base44.yml down` (البيانات والـ volumes تبقى).

---

## 22. المنافذ والخدمات وكيفية اتصالها

### في Docker (Base44)

```
المتصفح ──► http://localhost:3000 ──► web (vite :5173) ── /api ──► api (nest :3001) ──► db (:5432)
                (host 3000 → container 5173)              (proxy)  (internal only)
```

| المنفذ | الخدمة | ملاحظات |
|---|---|---|
| **3000 (host)** | Vite web | نقطة الدخول الوحيدة المعلنة — كل شيء عبر أصل واحد (cookies تعمل بـ SameSite=Lax) |
| 5173 (container) | Vite web | strictPort |
| 3001 (container) | NestJS API | غير معلن للمضيف — يُوصل عبر بروكسي Vite فقط |
| 5432 (container) | PostgreSQL | غير معلن للمضيف — داخل شبكة compose فقط |

### محليًا بدون Docker

| المنفذ | الخدمة |
|---|---|
| 3000 | NestJS API (`PORT` الافتراضي من env.validation) |
| 5173 | Vite web — بروكسي `/api` → `http://localhost:3000` (الافتراضي في vite.config.ts) |
| 5432 | PostgreSQL المحلي |

---

## 23. أوامر المشروع المهمة

كلها من **جذر المشروع** (إلا ما ذُكر خلاف ذلك):

```bash
# ── التثبيت والبناء ──
pnpm install                  # تثبيت كل الـ workspace
pnpm build:packages           # بناء الحزم المشتركة (شرط لتشغيل API/seed)
pnpm build:apps               # بناء API (nest build) + Web (tsc -b && vite build)
pnpm build                    # build:packages ثم build:apps
pnpm clean                    # حذف node_modules وdist في كل الحزم

# ── التطوير ──
pnpm dev                      # تشغيل API + Web معًا (parallel)
pnpm --filter @prince-net/api dev     # nest start --watch (منفذ 3000 محليًا)
pnpm --filter @prince-net/web dev     # vite (منفذ 5173)
pnpm --filter @prince-net/api start:prod  # node dist/main.js (إنتاج)

# ── الجودة ──
pnpm lint                     # ESLint لكل الحزم (--max-warnings 0)
pnpm typecheck                # build:packages ثم tsc --noEmit لكل الحزم
pnpm test                     # Jest (api) / no-op (web)

# ── Prisma ──
pnpm prisma:generate          # توليد Prisma Client → apps/api/src/generated/prisma
pnpm prisma:migrate           # prisma migrate dev (تطوير — ينشئ migrations جديدة)
pnpm prisma:deploy            # prisma migrate deploy (تطبيق migrations — إنتاج)
pnpm prisma:seed              # tsx prisma/seed.ts (Admin + Packages + Settings)
pnpm prisma:studio            # Prisma Studio (استعراض البيانات)
pnpm --filter @prince-net/api exec prisma migrate diff \
  --from-empty --to-schema-datamodel prisma/schema.prisma --script   # SQL كامل من الـ schema

# ── Docker (Base44) ──
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml ps
docker compose -f docker-compose.base44.yml logs -f api
docker compose -f docker-compose.base44.yml down
```

> داخل حاويات Base44 استخدم `CI=true` مع pnpm (non-TTY) — انظر AGENTS.md.

---

## 24. ملفات .env ومتغيرات البيئة

### الملفات

| الملف | الدور | في Git؟ |
|---|---|---|
| `.env.example` | قالب التوثيق فقط (بدون قيم حقيقية) | ✅ |
| `apps/api/.env` | **البيئة المحلية الفعلية** على جهاز Windows (يقرؤها dotenv/Nest) | ❌ gitignored |
| `.env.base44-defaults` | قيم افتراضية للتشغيل في Base44 (بلا أسرار) — أول ملف `env_file` في compose | ✅ |
| `/run/base44/app.env` | **أسرار Base44** (تُسلّمها المنصة مشفرة، خارج المستودع) — آخر `env_file` في compose فيتغلب على كل ما قبله | ❌ خارج المستودع |

> في Docker: متغيرات البيئة من compose تتغلب على `apps/api/.env` (dotenv لا يوطّئ `process.env` الموجودة).

### المتغيرات المدعومة (المصدر: `apps/api/src/config/env.validation.ts` — Zod، فشل التحقق = رفض الإقلاع)

| المتغير | الافتراضي | القاعدة |
|---|---|---|
| `NODE_ENV` | development | development/test/production |
| `PORT` | 3000 | 1–65535 (Base44: 3001) |
| `API_PREFIX` | api/v1 | بادئة كل المسارات |
| `DATABASE_URL` | — (مطلوب لـ Prisma) | `postgresql://user:pass@host:5432/prince_net?schema=public` |
| `JWT_SECRET` | — **مطلوب** | ≥ 32 حرفًا |
| `JWT_EXPIRES_IN` | 7d | نمط `^\d+[smhd]$` |
| `JWT_COOKIE_NAME` | prince_net_token | |
| `COOKIE_SECURE` | false | true/false (الإنتاج: true) |
| `COOKIE_SAME_SITE` | lax | lax/strict/none |
| `CSRF_SECRET` | — **مطلوب** | ≥ 16 حرفًا |
| `CORS_ORIGIN` | — **مطلوب** | يجب أن يكون URL صالحًا (يفشل الإقلاع إن لم يكن) |
| `BACKUP_DIR` | — **مطلوب** | **مسار مطلق** (يبدأ بـ `/` أو بحرف قرص Windows) |
| `ADMIN_EMAIL` | — (يتطلبه الـ seed) | بريد المستخدم الإداري |
| `ADMIN_PASSWORD` | — (يتطلبه الـ seed) | ≥ 12 حرفًا (يتحقق seed.ts) |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX` | 60 / 120 | حد الطلبات (ثوانٍ/عدد) |
| `VITE_APP_NAME` / `VITE_API_BASE_URL` | Prince Net / نسبي | للواجهة (الواجهة تستخدم `/api/v1` نسبيًا عبر البروكسي) |
| `API_PROXY_TARGET` | http://localhost:3000 | هدف بروكسي Vite (Base44: `http://api:3001`) |

---

## 25. 🔒 Private Environment & Credentials

> ### ⚠️ تحذير: هذا القسم سري
> يحتوي معلومات بيئة خاصة بالمشروع. **لا تنشر هذا الملف في مستودع عام ولا تشاركه مع أي طرف غير موثوق.** إن نُشر المستودع علنًا، احذف هذا القسم أولًا.

### أين توجد القيم الحقيقية

| المكان | المحتوى | ملاحظات |
|---|---|---|
| `apps/api/.env` (جهاز Windows المحلي — gitignored) | كل قيم البيئة المحلية الفعلية | المصدر عند التشغيل المحلي |
| `/run/base44/app.env` (بيئة Base44 — **مشفر خارج المستودع**) | `JWT_SECRET`, `CSRF_SECRET`, `ADMIN_PASSWORD` | تُسلّم تلقائيًا للحاويات؛ لا يمكن قراءتها من الكود |
| `docker-compose.base44.yml` | بيانات DB الدوكرية **التطويرية** | ليست أسرارًا — مضمّنة في compose |
| `.env.base44-defaults` | قيم غير سرية (NODE_ENV, أسماء cookies...) | ملف عام |

### بيانات بيئة Base44 (الدوكر — تطويرية)

| البند | القيمة |
|---|---|
| مستخدم PostgreSQL | `prince_net` |
| كلمة مرور PostgreSQL (تطويرية) | `prince_net_dev` — من compose، بيئة معزولة غير معلنة للخارج |
| القاعدة | `prince_net` (+ قاعدة الظل `prince_net_shadow`) |
| `DATABASE_URL` (داخل الحاويات) | `postgresql://prince_net:prince_net_dev@db:5432/prince_net?schema=public` |
| منفذ API الداخلي | 3001 (Web→API عبر بروكسي) |
| `BACKUP_DIR` | `/tmp/prince-net-backups` (volume باسم `backups`) |
| الأسرار في خزنة Base44 (الأسماء فقط) | `JWT_SECRET`, `CSRF_SECRET`, `ADMIN_PASSWORD` — قيم مشفرة تُدار من لوحة Base44 |

### بيانات البيئة المحلية على Windows (من `apps/api/.env` — القيم غير السرية)

| البند | القيمة |
|---|---|
| مضيف PostgreSQL المحلي | `192.168.137.12:5432` |
| مستخدم DB المحلي | `prince` (كلمة المرور في الملف نفسه) |
| اسم القاعدة | `prince_net` |
| بريد تسجيل دخول Admin المحلي | `ibrabra651@gmail.com` (كلمة المرور في الملف نفسه) |
| `CORS_ORIGIN` | `http://localhost:5173` |
| `BACKUP_DIR` | `C:/Users/Brince/Desktop/prince-fix-main/backups` |
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` |
| `JWT_SECRET` / `CSRF_SECRET` في الملف المحلي | **قيم placeholder تطويرية** (`base44-dev-...-placeholder`) وليست أسرارًا إنتاجية — يجب استبدالهما بقيم عشوائية حقيقية قبل أي استخدام فعلي |

### سياسة توثيق القيم السرية في هذا الملف

> بناءً على قواعد الأمان المتبعة في هذه الوثيقة، **لم تُنسخ القيم السرية الفعلية** (كلمات المرور، JWT/CSRF secrets) نصًّا إلى هنا — حتى لا توجد نسخة ثالثة منها في ملف قد يُنسى ويُنشر. القيم الفعلية موجودة فقط في `apps/api/.env` (محليًا) وفي خزنة Base44 المشفرة (بيئة الدوكر). عند الحاجة للقيمة: افتح الملف المصدر على الجهاز الموثوق.

- **قواعد القيم عند إنشاء قيم جديدة:** `JWT_SECRET` ≥ 32 حرفًا، `CSRF_SECRET` ≥ 16 حرفًا، `ADMIN_PASSWORD` ≥ 12 حرفًا — عشوائية، ولا تُعاد استخدامها بين البيئات.

---

## 26. حسابات Admin وإنشاء Admin جديد

### الحسابات الحالية

- **بيئة Base44 (الدوكر):** المستخدم الإداري الوحيد يُنشئه الـ seed من `ADMIN_EMAIL` (الافتراضي في `.env.base44-defaults`: `admin@prince-net.local`) و`ADMIN_PASSWORD` (سر مُدار في لوحة Base44).
- **البيئة المحلية (Windows):** `ADMIN_EMAIL=ibrabra651@gmail.com` (كلمة المرور في `apps/api/.env`).

> `Settings.adminEmail` (البريد الظاهر في الفواتير) مستقل عن `users.email` (بريد الدخول) — يُعدّل من صفحة الإعدادات.

### إنشاء/تهيئة Admin

```bash
# الطريقة الرسمية — الـ seed يعمل upsert:
#   وجّه ADMIN_EMAIL/ADMIN_PASSWORD ثم:
pnpm prisma:seed
#   - مستخدم موجود بنفس البريد؟ → تُحدَّث كلمة مروره فقط
#   - غير موجود؟ → يُنشأ (Argon2 hash)

# تغيير كلمة المرور بدون seed:
#   1) من التطبيق: الإعدادات → تغيير كلمة المرور (POST /api/v1/auth/change-password)
#      (يبطل كل الجلسات القديمة عبر tokenVersion)
#   2) يدويًا (كخيار أخير): عيّن ADMIN_PASSWORD الجديدة ثم pnpm prisma:seed
```

> النظام مصمم حاليًا كـ **admin واحد** — لا توجد واجهة لإضافة مستخدمين آخرين (إضافتهم ممكنة فقط مباشرة في DB بـ hash Argon2).

---

## 27. نقل المشروع بالكامل إلى جهاز آخر

### أ) بنفس قاعدة البيانات (Schema + Data)

1. انسخ المستودع: `git clone <repo>` (أو نسخ المجلد **بدون** `node_modules`, `dist`, `apps/api/src/generated`).
2. ثبّت المتطلبات على الجهاز الجديد (§20): Node 22، pnpm 11، PostgreSQL 16.
3. انقل قاعدة البيانات (§16):
   ```bash
   # على القديم
   pg_dump -U prince_net -d prince_net -F c -f prince_net.dump
   # انقل الملف، ثم على الجديد:
   createdb -U prince_net prince_net
   pg_restore -U prince_net -d prince_net --clean --if-exists prince_net.dump
   ```
4. أنشئ `apps/api/.env` بقيم الجهاز الجديد (`DATABASE_URL`، أسرار جديدة، `BACKUP_DIR` مطلق).
5. `pnpm install && pnpm build:packages && pnpm prisma:generate`
   - **لا تشغّل** `prisma:deploy` إلا للتحقق (`migrate deploy` idempotent وآمن) — و**لا تشغّل الـ seed** (قاعدة منقولة بها admin بالفعل؛ seed آمن لأنه upsert لكن غير ضروري).
6. `pnpm dev` — وتحقق: `curl http://localhost:3000/api/v1/health`.

### ب) عبر Docker (الطريقة الأسهل داخل Base44)

انسخ المستودع ونفّذ §21 — الـ compose يبني كل شيء ويطبق migrations وينفذ seed على قاعدة فارغة جديدة. لاستيراد البيانات القديمة استخدم أمر الاستعادة من §16 داخل حاوية `db`.

---

## 28. إنشاء نسخة جديدة من المشروع بقاعدة فارغة

```bash
# 1) قاعدة جديدة (من psql)
CREATE USER prince_net_new WITH PASSWORD '...';
CREATE DATABASE prince_net_new OWNER prince_net_new;

# 2) بيئة جديدة
#    عدّل DATABASE_URL في apps/api/.env إلى prince_net_new
#    وحدد ADMIN_EMAIL/ADMIN_PASSWORD جديدين

# 3) بنية + بيانات أولية
pnpm install
pnpm build:packages
pnpm prisma:generate
pnpm prisma:deploy      # البنية فقط (17 جدولًا + كل الفهارس والقيود)
pnpm prisma:seed        # Admin جديد + 5 باقات افتراضية + Settings افتراضية
pnpm dev
```

النتيجة: نظام نظيف — صفر فواتير/مدفوعات/موزعين؛ جاهز للإدخال من الصفر. الباقات الافتراضية من `packages/config/src/defaults.ts`: باقة 100/200/250/500/1000 ريال، والإعدادات: networkName=Prince Net، عملة=ريال (ر.ي)، حد المخزون المنخفض=10.

---

## 29. Deployment / Production

> الحالة الراهنة: التطبيق يعمل في **بيئة تطوير** (dev servers + watch). للإنتاج:

1. **البناء:** `pnpm build` → API إلى `apps/api/dist` (شغّل بـ `pnpm --filter @prince-net/api start:prod` أي `node dist/main.js`)؛ Web إلى `apps/web/dist` (قدّمه بأي خادم ثابت: Nginx/Caddy — SPA يحتاج fallback إلى `index.html`).
2. **إعداد بيئة الإنتاج:**
   - `NODE_ENV=production`.
   - **أسرار جديدة قوية** (لا تعيد استخدام قيم التطوير placeholders إطلاقًا): `JWT_SECRET` (32+)، `CSRF_SECRET` (16+).
   - `COOKIE_SECURE=true` + **HTTPS إلزامي** (خلف reverse proxy ينتهي TLS — تأكد أن الوكيل يمرر `X-Forwarded-Proto` وأن NestJS يثق به إن استخدمت `req.ip` للـ audit/rate-limit).
   - `CORS_ORIGIN` = أصل الواجهة الفعلي فقط (تحقق Zod يرفض قيمًا غير URL). في نشر same-origin (الواجهة تخدم من البروكسي نفسه) يمكن الإبقاء على قيمة الأصل.
   - `BACKUP_DIR` = مسار مطلق خارج أي web root (مثال: `/var/prince-net/backups`).
   - `RATE_LIMIT_*` حسب الحمل.
3. **قاعدة البيانات:**
   - استخدم `prisma migrate deploy` فقط (ليس dev).
   - نسخ احتياطي دوري عبر `pg_dump` (cron) — نظام النسخ الداخلي ليس بديلًا عنه.
   - مستخدم DB بصلاحيات محدودة (لا superuser)، وكلمة مرور قوية.
4. **أمور يجب تأمينها/معرفتها:**
   - النظام أحادي المستخدم حاليًا — كل مستخدم مصادق يملك كل الصلاحيات. للاستخدام بمستخدمين متعددين يلزم نظام أدوار (غير موجود حاليًا).
   - حافظ على helmet وCSRF وrate limiting كما هي.
   - راقب `audit_logs` للمراجعة الدورية.
   - لا تنشر `.env` أو النسخ الاحتياطية داخل مستودع/مجلد عام.
5. **ملاحظة من الـ schema:** الإنتاج مستهدف على Linux (خوادم عادية أو Serv00 كما ورد في تعليقات المشروع). `engineType = "client"` خيار مقصود (بدون Rust engine).

---

## 30. Security — إعدادات الأمان الحالية

| الطبقة | الوضع الحالي |
|---|---|
| المصادقة | JWT في HttpOnly cookie (لا يُقرأ من JS) + Argon2 لكلمات المرور |
| إبطال الجلسات | `tokenVersion` يُرفَع عند logout وتغيير كلمة المرور → كل JWT القديم يصبح غير صالح |
| CSRF | double-submit cookie (`csrf-csrf`) على كل التغييرات — رأس `x-csrf-token` |
| رؤوس HTTP | helmet على كل الاستجابات |
| CORS | أصل واحد فقط (متغير البيئة) + `credentials: true` |
| Rate limiting | 120 طلب/60 ث افتراضيًا (ThrottlerGuard عام) |
| التحقق من المدخلات | class-validator (whitelist + forbidNonWhitelisted) + Zod schemas مشتركة للطرفين |
| قاعدة البيانات | FK Restrict على كل المالي (لا حذف عرضي)، polymorphic refs بدون FK بقصد |
| التدقيق | AuditLog لكل عملية حساسة مع old/new values + IP + UserAgent |
| التفويض | **نقطة تحسين معروفة:** لا أدوار — كل مستخدم مصادق = admin كامل |
| Cookies في التطوير | `COOKIE_SECURE=false` و`SameSite=lax` (الإنتاج: secure + HTTPS) |
| الأسرار في التطوير | عدة قيم placeholder (`base44-dev-...`) — **غير صالحة للإنتاج** |
| `BACKUP_DIR` | خارج web root (تحقق مسار مطلق عند الإقلاع) |

---

## 31. Troubleshooting — المشاكل الشائعة وحلولها

| المشكلة | السبب المحتمل | الحل |
|---|---|---|
| API لا يقلع: `Validation failed` لـ env | متغير ناقص/غير صالح (`JWT_SECRET` قصير، `CORS_ORIGIN` ليس URL، `BACKUP_DIR` غير مطلق) | صحّح قيمة المتغير المذكور في رسالة الخطأ — Zod يسمّيه |
| `P1001: Can't reach database server` | PostgreSQL غير مشغل أو `DATABASE_URL` خاطئ | شغّل DB، تحقق من host/port/user/pass في `DATABASE_URL` |
| `database "prince_net_shadow" does not exist` (عند `prisma migrate dev`) | قاعدة الظل غير موجودة | `CREATE DATABASE prince_net_shadow OWNER prince_net;` |
| `table "_prisma_migrations" does not exist` | `migrate reset/diff` على قاعدة بلا migrations بعد | نفّذ `pnpm prisma:deploy` أولًا |
| خطأ مثل `column si.line_total does not exist` عند فحص SQL | اسم عمود خاطئ في استعلام فحص يدوي — العمود الصحيح في `sale_items` هو **`total_price`** | استخدم استعلامات §18 |
| خطأ `column "d.id" must appear in the GROUP BY` مع `HAVING true OFFSET 0 FETCH FIRST 0` | نمط استطلاع داخلي من Prisma (introspection/diff) — **ليس خطأ تطبيق** | يمكن تجاهله إن كان أثناء `migrate diff/db pull` |
| API يعمل لكن Web يفشل بـ 401/403 على التعديلات | CSRF token مفقود/منتهٍ | الواجهة تجلبه من `GET /api/v1/auth/csrf` قبل كل تعديل — حدّث الصفحة؛ تحقق أن `CSRF_SECRET` نفسه في الخدمة |
| `Cannot find module '@prince-net/config'` (أو types/validation) | الحزم المشتركة غير مبنيّة | `pnpm build:packages` ثم أعد التشغيل |
| أخطاء Prisma Client بعد تعديل schema | الـ client المولَّد قديم | `pnpm prisma:generate` |
| تغييرات الكود لا تظهر في Docker | الحاوية تخدم build قديم | بيئة Base44 مُلصقة بالمصدر مع watch — إن لم تنعكس: `docker compose -f docker-compose.base44.yml restart api web` |
| `nest start --watch` لا يعمل داخل الحاوية | أدوات العمليات مفقودة في الصورة | صورة `Dockerfile.base44` تتضمن `procps` لهذا الغرض |
| pnpm داخل الحاوية يرفض التثبيت/الحذف | TTY | استخدم `CI=true pnpm ...` |
| مستخدم لا يستطيع الدخول بعد تغيير كلمة مرور أخرى | `tokenVersion` رُفع | سجّل دخولًا جديدًا (سلوك مقصود) |
| فاتورة "غير مدفوعة" رغم وجود دفعات | الدفعات بحالة REVERSED (مستثناة من الحساب عمدًا) | راجع سجل العمليات لسبب العكس |
| الـ healthcheck يفشل عند إقلاع API طويل | `start_period` قصير | compose يمنح API 90 ثانية grace — تحقق من سجلات `migrate` |
| فحص الحالة | — | `curl http://localhost:3000/api/v1/health` → `{"status":"ok","database":"ok"}` |

---

## 32. Maintenance — تحديث المشروع مستقبلًا بأمان

### تحديث الـ dependencies

```bash
# 1) حدّث حزمة واحدة (مثال) وافحص الـ lockfile
pnpm --filter @prince-net/api update zod
# 2) تحقق شامل قبل الدفع
pnpm typecheck && pnpm lint && pnpm test
# 3) أعد بناء وتشغيل
pnpm build && pnpm dev
# في Base44: CI=true pnpm install داخل الحاوية ثم docker compose restart api web
```

- **الترقيات الممنوعة حاليًا (كسر توافق مؤكد):** Prisma 7، Tailwind 4، ESLint 9+، React 19، zod 4، react-router 7.
- عند ترقية Prisma: الطرفان (client + CLI) بنفس الإصدار، ثم `pnpm prisma:generate`، ثم شغّل الـ tests، ولا تنسَ أن `engineType="client"` + `@prisma/adapter-pg` خياران مقصودان.

### تعديل الـ Schema وإضافة Migration (بأمان على البيانات)

```bash
# 1) عدّل apps/api/prisma/schema.prisma
# 2) أنشئ migration على قاعدة الظل (بيئة تطوير فقط — لا يلمس الإنتاج)
pnpm prisma:migrate            # prisma migrate dev --name <وصف>
# 3) راجع ملف SQL المولّد في apps/api/prisma/migrations/<timestamp>_<name>/
#    ⚠️ راجع أن ALTER لا يحذف بيانات؛ الحقول الجديدة يجب أن تكون قابلة لـ default
# 4) أعد توليد الـ client واختبر
pnpm prisma:generate && pnpm typecheck && pnpm test
# 5) الإنتاج/الدوكر: pnpm prisma:deploy (يطبق migrations المعلّقة فقط — آمن ومتكرر)
```

- **قاعدة ذهبية للماليات:** أي تعديل schema يجب أن يحترم القيم الثابتة (§8) — لا تضف أرصدة مخزنة، وابقِ كل FK المالي Restrict.
- **نشر migration على قاعدة فيها بيانات:** جرّب أولًا على نسخة (`pg_dump` → استعادة إلى قاعدة تجريبية → `prisma migrate deploy`) ثم الإنتاج.
- **نسخ احتياطي قبل أي صيانة كبيرة:** `pg_dump` كامل (§16) + نسخة داخلية من `/backup`.
- بعد أي تعديل schema شغّل فحوص سلامة §18.
- حدّث هذا الملف (و`AGENTS.md`) عند أي تغيير بنيوي.

---

## ✅ خاتمة

هذا الملف مرجع تشغيلي كامل مبني على الكود الفعلي بتاريخ 2026-10-04. أي تعارض بينه وبين الكود لاحقًا → **الكود هو المرجع** (خصوصًا `apps/api/prisma/schema.prisma` وملفات الـ controllers).
