import { BarChart3 } from 'lucide-react';
import type { MoneyString, ProfitabilityMetrics } from '@prince-net/types';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useProfitabilityReport } from '../hooks/useProfitabilityReport';
import { formatMoney } from '../../../lib/currency';
import { formatShortDate } from '../../../lib/format';
import { cn } from '../../../lib/utils';

function MetricsRow({
  label,
  current,
  previous,
  tone,
}: {
  label: string;
  current: MoneyString;
  previous: MoneyString | null;
  tone?: 'positive' | 'negative';
}) {
  const hasPrev =
    previous !== null &&
    previous !== '0.00' &&
    previous !== '0' &&
    current !== '0.00' &&
    current !== '0';
  // مقارنة نصية للعرض فقط — الحساب في Backend
  const grew = hasPrev && current > previous;

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {hasPrev && (
          <Badge variant={grew ? 'success' : 'secondary'} className="text-[10px]">
            {grew ? '▲' : '▼'} عن الفترة السابقة
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        {previous && (
          <span className="num text-xs text-muted-foreground line-through decoration-muted-foreground/40">
            {formatMoney(previous)}
          </span>
        )}
        <span
          className={cn(
            'num font-bold',
            tone === 'positive' && 'text-green-600',
            tone === 'negative' && 'text-destructive',
          )}
        >
          {formatMoney(current)}
        </span>
      </div>
    </div>
  );
}

interface ProfitabilityReportTabProps {
  dateFrom: string;
  dateTo: string;
}

export function ProfitabilityReportTab({
  dateFrom,
  dateTo,
}: ProfitabilityReportTabProps) {
  const { data, isLoading, isError, error, refetch } = useProfitabilityReport({
    dateFrom,
    dateTo,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير الأرباح"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  if (data.current.sales === '0.00' || data.current.sales === '0') {
    return (
      <EmptyState
        icon={BarChart3}
        title="لا توجد بيانات في هذه الفترة"
        description="سجّل مبيعات أولًا ليظهر تحليل الأرباح"
      />
    );
  }

  const m: ProfitabilityMetrics = data.current;
  const p = data.previous;

  return (
    <div className="space-y-4">
      {/* Margins */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">المبيعات</p>
            <p className="num text-2xl font-bold">{formatMoney(m.sales)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatShortDate(data.currentPeriod.from)} —{' '}
              {formatShortDate(data.currentPeriod.to)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">الربح الإجمالي</p>
            <p className="num text-2xl font-bold text-green-600">
              {formatMoney(m.grossProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              هامش إجمالي {m.grossMargin}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">الربح الصافي</p>
            <p
              className={cn(
                'num text-2xl font-bold',
                m.netProfit.startsWith('-') ? 'text-destructive' : 'text-green-600',
              )}
            >
              {formatMoney(m.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              هامش صافي {m.netMargin}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">تكلفة المبيعات (COGS)</p>
            <p className="num text-2xl font-bold text-destructive">
              {formatMoney(m.cogs)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">محسوبة بطريقة FIFO</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">بنود الأرباح والتكاليف</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MetricsRow label="المبيعات" current={m.sales} previous={p?.sales ?? null} />
            <MetricsRow
              label="تكلفة البطاقات المباعة"
              current={m.cogs}
              previous={p?.cogs ?? null}
              tone="negative"
            />
            <MetricsRow
              label="الربح الإجمالي"
              current={m.grossProfit}
              previous={p?.grossProfit ?? null}
              tone="positive"
            />
            <MetricsRow
              label="المصروفات التشغيلية"
              current={m.operatingExpenses}
              previous={p?.operatingExpenses ?? null}
              tone="negative"
            />
            <MetricsRow
              label="تكاليف الخطوط"
              current={m.lineCosts}
              previous={p?.lineCosts ?? null}
              tone="negative"
            />
            <MetricsRow
              label="الربح الصافي"
              current={m.netProfit}
              previous={p?.netProfit ?? null}
              tone="positive"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              بنود منفصلة (لا تدخل في الربح)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <MetricsRow
              label="التحصيلات"
              current={m.collections}
              previous={p?.collections ?? null}
            />
            <MetricsRow
              label="سحوبات المالك"
              current={m.ownerWithdrawals}
              previous={p?.ownerWithdrawals ?? null}
            />
            <p className="text-xs text-muted-foreground pt-2 border-t">
              سحوبات المالك ليست مصروفًا تشغيليًا — تُستقطع من حقوق المالك ولا
              تؤثر على ربحية النشاط. التحصيلات تُحسب من الدفعات ACTIVE فقط.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
