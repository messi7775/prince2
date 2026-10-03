import type { EntityStatus, ISODateString, MoneyString, UUID } from "./common";
export interface Line { id:UUID; name:string; provider:string; identifier:string; speed:string|null; cost:MoneyString; subscriptionDate:ISODateString; notes:string|null; status:EntityStatus; createdAt:ISODateString; updatedAt:ISODateString; }
