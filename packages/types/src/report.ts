import type { ISODateString, MoneyString, UUID } from "./common";
export interface SalesReportRow { date:ISODateString; invoiceNumber:string; distributorName:string; packageName:string; quantity:number; total:MoneyString; }
export interface SalesReportSummary { salesCount:number; totalSales:MoneyString; totalPaid:MoneyString; totalRemaining:MoneyString; }
export interface CashReportRow { date:ISODateString; direction:'IN'|'OUT'; sourceType:string; description:string; amount:MoneyString; }
export interface CashReportSummary { opening:MoneyString; totalIn:MoneyString; totalOut:MoneyString; closing:MoneyString; }
export interface InventoryReportRow { packageId:UUID; packageName:string; opening:number; added:number; sold:number; returned:number; adjusted:number; current:number; }
export interface DistributorReportRow { distributorId:UUID; distributorName:string; totalSales:MoneyString; totalPayments:MoneyString; balance:MoneyString; invoiceCount:number; avgInvoice:MoneyString; }
export interface ExpenseReportRow { categoryId:UUID; categoryName:string; count:number; total:MoneyString; }
export interface LineReportRow { lineId:UUID; lineName:string; totalPayments:MoneyString; lastPaymentDate:ISODateString|null; status:string; }
export interface CollectionsReportRow { date:ISODateString; invoiceNumber:string; distributorName:string; amount:MoneyString; status:string; notes:string|null; }
export interface CollectionsReportSummary { count:number; totalCollected:MoneyString; }
export interface OwnerWithdrawalsReportRow { date:ISODateString; reason:string; amount:MoneyString; status:string; notes:string|null; }
export interface OwnerWithdrawalsReportSummary { count:number; totalWithdrawn:MoneyString; }

/* ─── تقرير الأرباح (Profitability) ───
   Sales      = إجمالي فواتير ACTIVE (لا يساوي التحصيل)
   COGS       = تكلفة البطاقات المباعة (FIFO — من inventory_movements SELL)
   GrossProfit = Sales - COGS
   OperatingExpenses = مصروفات ACTIVE
   LineCosts  = دفعات خطوط ACTIVE
   NetProfit  = GrossProfit - OperatingExpenses - LineCosts
   سحوبات المالك ليست مصروفًا تشغيليًا — تُعرض منفصلة.
   Collections = تحصيلات ACTIVE (تُعرض منفصلة، ليست مبيعات). */
export interface ProfitabilityMetrics {
    sales: MoneyString;
    cogs: MoneyString;
    grossProfit: MoneyString;
    operatingExpenses: MoneyString;
    lineCosts: MoneyString;
    netProfit: MoneyString;
    collections: MoneyString;
    ownerWithdrawals: MoneyString;
    grossMargin: number;
    netMargin: number;
}
export interface ProfitabilityReport {
    currentPeriod: { from: ISODateString; to: ISODateString };
    previousPeriod: { from: ISODateString; to: ISODateString } | null;
    current: ProfitabilityMetrics;
    previous: ProfitabilityMetrics | null;
}
