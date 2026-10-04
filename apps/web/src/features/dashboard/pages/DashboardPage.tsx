import { QuickActions } from '../components/QuickActions';
import { useState } from 'react';
import {
  Banknote,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react';
import type { DashboardPeriod } from '@prince-net/types';
import { PeriodStats } from '../components/PeriodStats';
import { SalesSeriesChart } from '../components/SalesSeriesChart';
import { PageHeader } from '../../../components/layout/PageHeader';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { StatCard } from '../components/StatCard';
import { FinancialSummary } from '../components/FinancialSummary';
import { TopPackages } from '../components/TopPackages';
import { DistributorDebts } from '../components/DistributorDebts';
import { LowStockAlerts } from '../components/LowStockAlerts';
import { RecentTransactions } from '../components/RecentTransactions';
import { useDashboard } from '../hooks/useDashboard';
import { formatMoney } from '../../../lib/currency';

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data, isLoading, isError, error, refetch } = useDashboard(period);

  if (isLoading) {
    return <LoadingState message="جارٍ تحميل لوحة التحكم..." />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل لوحة التحكم"
        message={error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على أداء الشبكة"
      />

      <QuickActions />

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="مبيعات اليوم"
          value={formatMoney(data.todaySales)}
          icon={ShoppingCart}
          description={`${data.todaySalesCount} عملية بيع`}
        />
        <StatCard
          title="تحصيلات اليوم"
          value={formatMoney(data.todayPayments)}
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="رصيد الصندوق"
          value={formatMoney(data.cashBalance)}
          icon={Banknote}
        />
        <StatCard
          title="إجمالي ديون الموزعين"
          value={formatMoney(data.totalDistributorDebt)}
          icon={Users}
          variant="destructive"
        />
        <StatCard
          title="مصروفات اليوم"
          value={formatMoney(data.todayExpenses)}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="سحوبات المالك اليوم"
          value={formatMoney(data.todayOwnerWithdrawals)}
          icon={Wallet}
          variant="warning"
        />
      </div>

      {/* Period analysis + comparison */}
      <PeriodStats
        period={period}
        onPeriodChange={setPeriod}
        stats={data.periodStats}
      />

      {/* 14-day series chart */}
      <SalesSeriesChart data={data.series} />

      {/* Financial summary */}
      <FinancialSummary data={data.financialSummary} />

      {/* Lists */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TopPackages data={data.topPackages} />
        <DistributorDebts data={data.distributorDebts} />
        <LowStockAlerts data={data.lowStockAlerts} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions data={data.recentTransactions} />
    </div>
  );
}