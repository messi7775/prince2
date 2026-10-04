import type { EntityStatus, ISODateString, MoneyString, UUID } from "./common";
export interface Distributor { id: UUID; name: string; phone: string; address: string | null; notes: string | null; status: EntityStatus; registrationDate: ISODateString; createdAt: ISODateString; updatedAt: ISODateString; }
export interface DistributorBalance { distributorId: UUID; totalSales: MoneyString; totalPayments: MoneyString; balance: MoneyString; }

/* ─── كشف حساب الموزع (Statement) ───
   يُحسب من الـ Ledger الحالي (sales + payments) — لا رصيد مخزن.
   debit = فاتورة ACTIVE (تزيد مديونية الموزع)
   credit = دفعة ACTIVE (تقلل المديونية)
   السجلات الملغاة/المعكوسة تُعرض للحصر ولا تؤثر على الرصيد. */
export type DistributorStatementEntryType = 'SALE' | 'PAYMENT' | 'SALE_CANCELLED' | 'PAYMENT_REVERSED';
export interface DistributorStatementEntry {
    id: UUID;
    entryType: DistributorStatementEntryType;
    date: ISODateString;
    reference: string;
    referenceUrl: string;
    debit: MoneyString;
    credit: MoneyString;
    balanceAfter: MoneyString;
    status: string;
}
export interface DistributorStatementSummary {
    openingBalance: MoneyString;
    totalDebit: MoneyString;
    totalCredit: MoneyString;
    closingBalance: MoneyString;
}
export interface DistributorStatement {
    entries: DistributorStatementEntry[];
    summary: DistributorStatementSummary;
}
