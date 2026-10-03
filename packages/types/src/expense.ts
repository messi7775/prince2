import type { ISODateString, MoneyString, UUID } from "./common";
export type ExpenseStatus = 'ACTIVE' | 'REVERSED';
export interface Expense { id: UUID; categoryId: UUID; description: string; amount: MoneyString; status: ExpenseStatus; expenseDate: ISODateString; notes: string | null; createdBy: UUID; createdAt: ISODateString; updatedAt: ISODateString; reversedAt: ISODateString | null; reversedBy: UUID | null; reversalReason: string | null; }
