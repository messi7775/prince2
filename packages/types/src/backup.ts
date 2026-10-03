import type { ISODateString, UUID } from "./common";
export interface Backup { id: UUID; fileName: string; sizeBytes: number; recordCount: number; checksum: string; createdBy: UUID; createdAt: ISODateString; }
