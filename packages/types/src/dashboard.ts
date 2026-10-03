import type { MoneyString, UUID } from "./common";
export interface DashboardSummary { todaySales: MoneyString; todayPayments: MoneyString; todayExpenses: MoneyString; todayOwnerWithdrawals: MoneyString; cashBalance: MoneyString; totalDistributorDebt: MoneyString; todaySalesCount: number; lowStockAlerts: DashboardLowStockAlert[]; }
export interface DashboardLowStockAlert { packageId: UUID; packageName: string; currentStock: number; threshold: number; }
export interface DashboardTopPackage { packageId: UUID; packageName: string; quantity: number; total: MoneyString; }
export interface DashboardDistributorDebt { distributorId: UUID; distributorName: string; balance: MoneyString; }
export interface DashboardRecentTransaction { id: UUID; type: string; description: string; amount: MoneyString; direction: 'IN' | 'OUT'; createdAt: string; }
export interface DashboardData extends DashboardSummary { topPackages: DashboardTopPackage[]; distributorDebts: DashboardDistributorDebt[]; recentTransactions: DashboardRecentTransaction[]; }
