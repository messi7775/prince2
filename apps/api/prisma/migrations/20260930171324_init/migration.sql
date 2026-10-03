-- CreateEnum
CREATE TYPE "public"."EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."SaleStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."LinePaymentStatus" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."ExpenseStatus" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."OwnerWithdrawalStatus" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('ADD', 'SELL', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."CashDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "public"."CashSourceType" AS ENUM ('OPENING', 'SALE_PAYMENT', 'SALE_PAYMENT_REVERSAL', 'EXPENSE', 'EXPENSE_REVERSAL', 'LINE_PAYMENT', 'LINE_PAYMENT_REVERSAL', 'OWNER_WITHDRAWAL', 'OWNER_WITHDRAWAL_REVERSAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('LOGIN', 'LOGIN_FAILED', 'PACKAGE_CREATED', 'PACKAGE_UPDATED', 'INVENTORY_ADDED', 'INVENTORY_ADJUSTED', 'INVENTORY_RETURNED', 'DISTRIBUTOR_CREATED', 'DISTRIBUTOR_UPDATED', 'SALE_CREATED', 'SALE_CANCELLED', 'PAYMENT_CREATED', 'PAYMENT_REVERSED', 'LINE_CREATED', 'LINE_UPDATED', 'LINE_PAYMENT_CREATED', 'LINE_PAYMENT_REVERSED', 'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_REVERSED', 'OWNER_WITHDRAWAL_CREATED', 'OWNER_WITHDRAWAL_REVERSED', 'CASH_MANUAL_IN', 'CASH_MANUAL_OUT', 'BACKUP_CREATED', 'BACKUP_RESTORED', 'SETTINGS_UPDATED', 'PASSWORD_CHANGED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "data_size_mb" INTEGER NOT NULL,
    "hours" INTEGER NOT NULL,
    "color" TEXT,
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."package_stocks" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "package_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_movements" (
    "id" UUID NOT NULL,
    "package_stock_id" UUID NOT NULL,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."distributors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "registration_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "distributor_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."SaleStatus" NOT NULL DEFAULT 'ACTIVE',
    "sale_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sale_items" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "package_name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "payment_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_at" TIMESTAMPTZ(6),
    "reversed_by" UUID,
    "reversal_reason" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lines" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "speed" TEXT,
    "cost" DECIMAL(12,2) NOT NULL,
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "subscription_date" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."line_payments" (
    "id" UUID NOT NULL,
    "line_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "period" TEXT NOT NULL,
    "status" "public"."LinePaymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "payment_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_at" TIMESTAMPTZ(6),
    "reversed_by" UUID,
    "reversal_reason" TEXT,

    CONSTRAINT "line_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenses" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."ExpenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "expense_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "reversed_at" TIMESTAMPTZ(6),
    "reversed_by" UUID,
    "reversal_reason" TEXT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."owner_withdrawals" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."OwnerWithdrawalStatus" NOT NULL DEFAULT 'ACTIVE',
    "withdrawal_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_at" TIMESTAMPTZ(6),
    "reversed_by" UUID,
    "reversal_reason" TEXT,

    CONSTRAINT "owner_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cash_movements" (
    "id" UUID NOT NULL,
    "direction" "public"."CashDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source_type" "public"."CashSourceType" NOT NULL,
    "source_id" UUID,
    "description" TEXT,
    "movement_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."backups" (
    "id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "record_count" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" UUID NOT NULL,
    "singleton_key" TEXT NOT NULL DEFAULT 'main',
    "network_name" TEXT NOT NULL,
    "currency_name" TEXT NOT NULL,
    "currency_symbol" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "public"."packages"("name");

-- CreateIndex
CREATE INDEX "packages_status_idx" ON "public"."packages"("status");

-- CreateIndex
CREATE INDEX "package_stocks_package_id_idx" ON "public"."package_stocks"("package_id");

-- CreateIndex
CREATE INDEX "package_stocks_received_at_idx" ON "public"."package_stocks"("received_at");

-- CreateIndex
CREATE INDEX "package_stocks_created_at_idx" ON "public"."package_stocks"("created_at");

-- CreateIndex
CREATE INDEX "inventory_movements_package_stock_id_idx" ON "public"."inventory_movements"("package_stock_id");

-- CreateIndex
CREATE INDEX "inventory_movements_type_idx" ON "public"."inventory_movements"("type");

-- CreateIndex
CREATE INDEX "inventory_movements_reference_type_reference_id_idx" ON "public"."inventory_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "inventory_movements_created_at_idx" ON "public"."inventory_movements"("created_at");

-- CreateIndex
CREATE INDEX "distributors_name_idx" ON "public"."distributors"("name");

-- CreateIndex
CREATE INDEX "distributors_phone_idx" ON "public"."distributors"("phone");

-- CreateIndex
CREATE INDEX "distributors_status_idx" ON "public"."distributors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoice_number_key" ON "public"."sales"("invoice_number");

-- CreateIndex
CREATE INDEX "sales_distributor_id_idx" ON "public"."sales"("distributor_id");

-- CreateIndex
CREATE INDEX "sales_sale_date_idx" ON "public"."sales"("sale_date");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "public"."sales"("status");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "public"."sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_package_id_idx" ON "public"."sale_items"("package_id");

-- CreateIndex
CREATE INDEX "payments_sale_id_idx" ON "public"."payments"("sale_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "public"."payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "lines_status_idx" ON "public"."lines"("status");

-- CreateIndex
CREATE INDEX "lines_identifier_idx" ON "public"."lines"("identifier");

-- CreateIndex
CREATE INDEX "line_payments_line_id_idx" ON "public"."line_payments"("line_id");

-- CreateIndex
CREATE INDEX "line_payments_payment_date_idx" ON "public"."line_payments"("payment_date");

-- CreateIndex
CREATE INDEX "line_payments_status_idx" ON "public"."line_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_key" ON "public"."expense_categories"("name");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "public"."expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "public"."expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "public"."expenses"("status");

-- CreateIndex
CREATE INDEX "owner_withdrawals_withdrawal_date_idx" ON "public"."owner_withdrawals"("withdrawal_date");

-- CreateIndex
CREATE INDEX "owner_withdrawals_status_idx" ON "public"."owner_withdrawals"("status");

-- CreateIndex
CREATE INDEX "cash_movements_source_type_idx" ON "public"."cash_movements"("source_type");

-- CreateIndex
CREATE INDEX "cash_movements_source_type_source_id_idx" ON "public"."cash_movements"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "cash_movements_movement_date_idx" ON "public"."cash_movements"("movement_date");

-- CreateIndex
CREATE INDEX "cash_movements_direction_idx" ON "public"."cash_movements"("direction");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "backups_created_at_idx" ON "public"."backups"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_singleton_key_key" ON "public"."settings"("singleton_key");

-- AddForeignKey
ALTER TABLE "public"."package_stocks" ADD CONSTRAINT "package_stocks_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."package_stocks" ADD CONSTRAINT "package_stocks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_package_stock_id_fkey" FOREIGN KEY ("package_stock_id") REFERENCES "public"."package_stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale_items" ADD CONSTRAINT "sale_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."line_payments" ADD CONSTRAINT "line_payments_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "public"."lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."line_payments" ADD CONSTRAINT "line_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."line_payments" ADD CONSTRAINT "line_payments_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."owner_withdrawals" ADD CONSTRAINT "owner_withdrawals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."owner_withdrawals" ADD CONSTRAINT "owner_withdrawals_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."backups" ADD CONSTRAINT "backups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
