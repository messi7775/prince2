-- Prince Net: إغلاق الصندوق اليومي
-- 1) AuditAction جديد لعمليات الإغلاق
ALTER TYPE "AuditAction" ADD VALUE 'CASH_CLOSING_CREATED';

-- 2) جدول cash_closings — لقطة مجمّدة لحظة الإغلاق
CREATE TABLE "cash_closings" (
    "id" UUID NOT NULL,
    "closing_date" DATE NOT NULL,
    "opening_balance" DECIMAL(12,2) NOT NULL,
    "total_in" DECIMAL(12,2) NOT NULL,
    "total_out" DECIMAL(12,2) NOT NULL,
    "owner_withdrawals" DECIMAL(12,2) NOT NULL,
    "expected_balance" DECIMAL(12,2) NOT NULL,
    "actual_balance" DECIMAL(12,2) NOT NULL,
    "difference" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "closed_by" UUID NOT NULL,
    "closed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_closings_closing_date_key" ON "cash_closings"("closing_date");
CREATE INDEX "cash_closings_closing_date_idx" ON "cash_closings"("closing_date");

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
