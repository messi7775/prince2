import type { ISODateString, MoneyString, UUID } from "./common";
export type LinePaymentStatus='ACTIVE'|'REVERSED';
export interface LinePayment { id:UUID; lineId:UUID; amount:MoneyString; period:string; status:LinePaymentStatus; paymentDate:ISODateString; notes:string|null; createdBy:UUID; createdAt:ISODateString; reversedAt:ISODateString|null; reversedBy:UUID|null; reversalReason:string|null; }
