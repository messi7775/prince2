import type { MoneyString, UUID } from "./common";
export interface DashboardSummary { todaySales: MoneyString; todayPayments: MoneyString; todayExpenses: MoneyString; todayOwnerWithdrawals: MoneyString; cashBalance: MoneyString; totalDistributorDebt: MoneyString; todaySalesCount: number; lowStockAlerts: DashboardLowStockAlert[]; }
export interface DashboardLowStockAlert { packageId: UUID; packageName: string; currentStock: number; threshold: number; }
export interface DashboardTopPackage { packageId: UUID; packageName: string; quantity: number; total: MoneyString; }
export interface DashboardDistributorDebt { distributorId: UUID; distributorName: string; balance: MoneyString; }
export interface DashboardRecentTransaction { id: UUID; type: string; description: string; amount: MoneyString; direction: 'IN' | 'OUT'; createdAt: string; }
export interface DashboardFinancialSummary { totalPayments: MoneyString; totalExpenses: MoneyString; totalOwnerWithdrawals: MoneyString; cashIn: MoneyString; cashOut: MoneyString; cashBalance: MoneyString; transactionsCount: number; }
export interface DashboardData extends DashboardSummary { topPackages: DashboardTopPackage[]; distributorDebts: DashboardDistributorDebt[]; recentTransactions: DashboardRecentTransaction[]; financialSummary: DashboardFinancialSummary; periodStats: DashboardPeriodStats; series: DashboardSeriesPoint[]; }
export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';
export interface DashboardPeriodComparison { sales: MoneyString; collections: MoneyString; expenses: MoneyString; netCashFlow: MoneyString; }
export interface DashboardPeriodStats extends DashboardPeriodComparison {
    salesCount: number;
    previous: DashboardPeriodComparison | null;
    growth: { sales: number | null; collections: number | null; expenses: number | null; netCashFlow: number | null } | null;
}
export interface DashboardSeriesPoint { date: string; sales: MoneyString; collections: MoneyString; }
