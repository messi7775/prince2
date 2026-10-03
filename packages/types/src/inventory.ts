import type { ISODateString, MoneyString, UUID } from "./common";
import type { PackageStockSummary } from "./package-stock";
export type InventoryMovementType='ADD'|'SELL'|'RETURN'|'ADJUSTMENT';
export interface InventoryMovement { id:UUID; packageStockId:UUID; type:InventoryMovementType; quantityDelta:number; unitPrice:MoneyString; referenceType:string|null; referenceId:UUID|null; description:string|null; createdBy:UUID; createdAt:ISODateString; }
export interface InventoryRow { packageStockId:UUID; packageId:UUID; packageName:string; currentStock:number; }
export interface InventoryByPackage extends InventoryRow { movements:InventoryMovement[]; batches:PackageStockSummary[]; }
export interface LowStockAlert { packageId:UUID; packageName:string; currentStock:number; threshold:number; }
