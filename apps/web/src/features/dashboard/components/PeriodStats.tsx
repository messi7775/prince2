import type { DashboardPeriod, DashboardPeriodStats } from '@prince-net/types';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { formatMoney } from '../../../lib/currency';
import { cn } from '../../../lib/utils';

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: 'اليوم',
  week: 'آخر 7 أيام',
  month: 'هذا الشهر',
  year: 'هذه السنة',
};

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        لا توجد مقارنة
      </span>
    );
  }
  const positive = value >= 0;
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        positive ? 'text-green-600' : 'text-destructive',
      )}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {positive ? '+' : ''}
      {value}% عن الفترة السابقة
    </span>
  );
}

interface PeriodStatsProps {
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
  stats: DashboardPeriodStats;
}

export function PeriodStats({
  period,
  onPeriodChange,
  stats,
}: PeriodStatsProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">تحليل الفترة</h3>
            <p className="text-xs text-muted-foreground">
              مقارنة تلقائية بالفترة السابقة المماثلة
            </p>
          </div>
          <div className="w-36">
            <Select
              value={period}
              onValueChange={(v) => onPeriodChange(v as DashboardPeriod)}
            >
              <SelectTrigger aria-label="اختيار الفترة">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as DashboardPeriod[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">المبيعات</p>
            <p className="num text-lg font-bold">{formatMoney(stats.sales)}</p>
            <GrowthBadge value={stats.growth?.sales ?? null} />
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">التحصيلات</p>
            <p className="num text-lg font-bold text-green-600">
              {formatMoney(stats.collections)}
            </p>
            <GrowthBadge value={stats.growth?.collections ?? null} />
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">المصروفات</p>
            <p className="num text-lg font-bold text-destructive">
              {formatMoney(stats.expenses)}
            </p>
            <GrowthBadge value={stats.growth?.expenses ?? null} />
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">صافي التدفق النقدي</p>
            <p
              className={cn(
                'num text-lg font-bold',
                stats.netCashFlow.startsWith('-')
                  ? 'text-destructive'
                  : 'text-green-600',
              )}
            >
              {formatMoney(stats.netCashFlow)}
            </p>
            <GrowthBadge value={stats.growth?.netCashFlow ?? null} />
          </div>
        </div>

        <Label className="text-xs text-muted-foreground">
          {PERIOD_LABELS[period]} · {stats.salesCount} فاتورة
        </Label>
      </CardContent>
    </Card>
  );
}
