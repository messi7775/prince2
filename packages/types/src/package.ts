import type { EntityStatus, ISODateString, MoneyString, UUID } from "./common";
export interface PackageEntity { id:UUID; name:string; price:MoneyString; dataSizeMb:number; hours:number; color:string|null; status:EntityStatus; description:string|null; createdAt:ISODateString; updatedAt:ISODateString; }
