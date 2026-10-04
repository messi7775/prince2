import type { ISODateString, MoneyString, UUID } from "./common";
export type CashDirection = "IN" | "OUT";
export type CashSourceType = "OPENING" | "SALE_PAYMENT" | "SALE_PAYMENT_REVERSAL" | "EXPENSE" | "EXPENSE_REVERSAL" | "LINE_PAYMENT" | "LINE_PAYMENT_REVERSAL" | "OWNER_WITHDRAWAL" | "OWNER_WITHDRAWAL_REVERSAL" | "MANUAL";
export interface CashMovement { id: UUID; direction: CashDirection; amount: MoneyString; sourceType: CashSourceType; sourceId: UUID | null; description: string | null; movementDate: ISODateString; createdBy: UUID; createdAt: ISODateString; }
export interface CashBalance { totalIn: MoneyString; totalOut: MoneyString; balance: MoneyString; }

/* ─── الدفتر المالي الموحد (Unified Financial Ledger) ───
   يُبنى من cash_movements فقط (لا Ledger ثانٍ).
   balanceAfter يُحسب تراكميًا في الذاكرة حسب الترتيب الزمني. */
export interface CashLedgerEntry {
    id: UUID;
    date: ISODateString;
    sourceType: CashSourceType;
    sourceLabel: string;
    reference: string | null;
    referenceUrl: string | null;
    description: string | null;
    in: MoneyString;
    out: MoneyString;
    balanceAfter: MoneyString;
}
export interface CashLedgerSummary { opening: MoneyString; totalIn: MoneyString; totalOut: MoneyString; closing: MoneyString; }
export interface CashLedger { entries: CashLedgerEntry[]; summary: CashLedgerSummary; }

/* ─── إغلاق الصندوق اليومي ───
   لقطة مجمّدة لحظة الإغلاق — لا تُعدَّل بعد الإنشاء. */
export interface CashClosing {
    id: UUID;
    closingDate: string;
    openingBalance: MoneyString;
    totalIn: MoneyString;
    totalOut: MoneyString;
    ownerWithdrawals: MoneyString;
    expectedBalance: MoneyString;
    actualBalance: MoneyString;
    difference: MoneyString;
    notes: string | null;
    closedBy: UUID;
    closedByEmail: string | null;
    closedAt: ISODateString;
}
export interface CashClosingPreview {
    closingDate: string;
    openingBalance: MoneyString;
    totalIn: MoneyString;
    totalOut: MoneyString;
    ownerWithdrawals: MoneyString;
    expectedBalance: MoneyString;
    alreadyClosed: boolean;
}
