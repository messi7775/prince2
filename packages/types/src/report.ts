import type { ISODateString, MoneyString, UUID } from "./common";
export interface SalesReportRow { date:ISODateString; invoiceNumber:string; distributorName:string; packageName:string; quantity:number; total:MoneyString; }
export interface SalesReportSummary { salesCount:number; totalSales:MoneyString; totalPaid:MoneyString; totalRemaining:MoneyString; }
export interface CashReportRow { date:ISODateString; direction:'IN'|'OUT'; sourceType:string; description:string; amount:MoneyString; }
export interface CashReportSummary { opening:MoneyString; totalIn:MoneyString; totalOut:MoneyString; closing:MoneyString; }
export interface InventoryReportRow { packageId:UUID; packageName:string; opening:number; added:number; sold:number; returned:number; adjusted:number; current:number; }
export interface DistributorReportRow { distributorId:UUID; distributorName:string; totalSales:MoneyString; totalPayments:MoneyString; balance:MoneyString; }
export interface ExpenseReportRow { categoryId:UUID; categoryName:string; count:number; total:MoneyString; }
export interface LineReportRow { lineId:UUID; lineName:string; totalPayments:MoneyString; lastPaymentDate:ISODateString|null; status:string; }
export interface CollectionsReportRow { date:ISODateString; invoiceNumber:string; distributorName:string; amount:MoneyString; status:string; notes:string|null; }
export interface CollectionsReportSummary { count:number; totalCollected:MoneyString; }
export interface OwnerWithdrawalsReportRow { date:ISODateString; reason:string; amount:MoneyString; status:string; notes:string|null; }
export interface OwnerWithdrawalsReportSummary { count:number; totalWithdrawn:MoneyString; }
