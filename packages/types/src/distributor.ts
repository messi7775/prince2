import type { EntityStatus, ISODateString, MoneyString, UUID } from "./common";
export interface Distributor { id: UUID; name: string; phone: string; address: string | null; notes: string | null; status: EntityStatus; registrationDate: ISODateString; createdAt: ISODateString; updatedAt: ISODateString; }
export interface DistributorBalance { distributorId: UUID; totalSales: MoneyString; totalPayments: MoneyString; balance: MoneyString; }
