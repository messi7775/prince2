import type { ISODateString, MoneyString, UUID } from "./common";
export type CashDirection = "IN" | "OUT";
export type CashSourceType = "OPENING" | "SALE_PAYMENT" | "SALE_PAYMENT_REVERSAL" | "EXPENSE" | "EXPENSE_REVERSAL" | "LINE_PAYMENT" | "LINE_PAYMENT_REVERSAL" | "OWNER_WITHDRAWAL" | "OWNER_WITHDRAWAL_REVERSAL" | "MANUAL";
export interface CashMovement { id: UUID; direction: CashDirection; amount: MoneyString; sourceType: CashSourceType; sourceId: UUID | null; description: string | null; movementDate: ISODateString; createdBy: UUID; createdAt: ISODateString; }
export interface CashBalance { totalIn: MoneyString; totalOut: MoneyString; balance: MoneyString; }
