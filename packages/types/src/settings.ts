import type { ISODateString, UUID } from "./common";
export interface Settings { id: UUID; networkName: string; currencyName: string; currencySymbol: string; adminEmail: string; lowStockThreshold: number; createdAt: ISODateString; updatedAt: ISODateString; }
