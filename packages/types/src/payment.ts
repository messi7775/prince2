import type { ISODateString, MoneyString, UUID } from "./common";
export type PaymentStatus='ACTIVE'|'REVERSED';
export interface Payment { id:UUID; saleId:UUID; amount:MoneyString; status:PaymentStatus; paymentDate:ISODateString; notes:string|null; createdBy:UUID; createdAt:ISODateString; reversedAt:ISODateString|null; reversedBy:UUID|null; reversalReason:string|null; }
