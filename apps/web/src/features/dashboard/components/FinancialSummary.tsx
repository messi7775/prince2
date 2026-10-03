import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CreditCard,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardFinancialSummary } from '@prince-net/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import { formatMoney } from '../../../lib/currency';

interface FinancialSummaryProps {
  data: DashboardFinancialSummary;
}

interface SummaryItem {
  label: string;
  value: string;
  icon: LucideIcon;
  variant: 'default' | 'success' | 'destructive' | 'warning';
}

const itemStyles: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function FinancialSummary({ data }: FinancialSummaryProps) {
  const items: SummaryItem[] = [
    {
      label: 'إجمالي المدفوعات',
      value: formatMoney(data.totalPayments),
      icon: CreditCard,
      variant: 'success',
    },
    {
      label: 'إجمالي المصروفات',
      value: formatMoney(data.totalExpenses),
      icon: TrendingDown,
      variant: 'destructive',
    },
    {
      label: 'إجمالي سحوبات المالك',
      value: formatMoney(data.totalOwnerWithdrawals),
      icon: Wallet,
      variant: 'warning',
    },
    {
      label: 'إجمالي الداخل للصندوق',
      value: formatMoney(data.cashIn),
      icon: ArrowDownCircle,
      variant: 'success',
    },
    {
      label: 'إجمالي الخارج من الصندوق',
      value: formatMoney(data.cashOut),
      icon: ArrowUpCircle,
      variant: 'destructive',
    },
    {
      label: 'الرصيد النقدي الحالي',
      value: formatMoney(data.cashBalance),
      icon: Banknote,
      variant: 'default',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">الملخص المالي الحالي</CardTitle>
          <p className="text-xs text-muted-foreground">
            إجماليات فعلية من قاعدة البيانات، باستثناء العمليات المعكوسة
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          <span>
            <span className="num font-semibold text-foreground">
              {data.transactionsCount}
            </span>{' '}
            عملية مالية حالية
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  itemStyles[item.variant],
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{item.label}</p>
                <p className="num text-sm font-bold sm:text-base">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
