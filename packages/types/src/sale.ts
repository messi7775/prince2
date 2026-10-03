import type { ISODateString, MoneyString, UUID } from "./common";
export type SaleStatus = 'ACTIVE' | 'CANCELLED';
export interface SaleItem { id: UUID; saleId: UUID; packageId: UUID; packageNameSnapshot: string; quantity: number; unitPrice: MoneyString; totalPrice: MoneyString; createdAt: ISODateString; }
export interface Sale { id: UUID; invoiceNumber: string; distributorId: UUID; distributorName?: string; totalAmount: MoneyString; status: SaleStatus; saleDate: ISODateString; notes: string | null; createdBy: UUID; createdAt: ISODateString; updatedAt: ISODateString; cancelledAt: ISODateString | null; cancelledBy: UUID | null; cancellationReason: string | null; paidAmount?: MoneyString; remainingAmount?: MoneyString; }
export interface SaleDetails extends Sale { items: SaleItem[]; paidAmount: MoneyString; remainingAmount: MoneyString; }
