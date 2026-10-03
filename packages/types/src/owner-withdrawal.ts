import type { ISODateString, MoneyString, UUID } from "./common";

export type OwnerWithdrawalStatus = "ACTIVE" | "REVERSED";

export interface OwnerWithdrawal {
  id: UUID;
  amount: MoneyString;
  reason: string;
  status: OwnerWithdrawalStatus;
  withdrawalDate: ISODateString;
  notes: string | null;
  createdBy: UUID;
  createdAt: ISODateString;
  reversedAt: ISODateString | null;
  reversedBy: UUID | null;
  reversalReason: string | null;
}
