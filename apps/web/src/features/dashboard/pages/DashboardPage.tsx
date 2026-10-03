import {
  Banknote,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { StatCard } from '../components/StatCard';
import { TopPackages } from '../components/TopPackages';
import { DistributorDebts } from '../components/DistributorDebts';
import { LowStockAlerts } from '../components/LowStockAlerts';
import { RecentTransactions } from '../components/RecentTransactions';
import { useDashboard } from '../hooks/useDashboard';
import { formatMoney } from '../../../lib/currency';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

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