import type { ISODateString, UUID } from "./common";
export interface ExpenseCategory { id: UUID; name: string; description: string | null; isActive: boolean; createdAt: ISODateString; updatedAt: ISODateString; }
