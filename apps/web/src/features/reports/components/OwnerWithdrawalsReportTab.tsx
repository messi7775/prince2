import { Banknote, TrendingDown } from 'lucide-react';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { StatCard } from '../../dashboard/components/StatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Badge } from '../../../components/ui/badge';
import { useOwnerWithdrawalsReport } from '../hooks/useOwnerWithdrawalsReport';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';

interface OwnerWithdrawalsReportTabProps {
  dateFrom: string;
  dateTo: string;
}

export function OwnerWithdrawalsReportTab({
  dateFrom,
  dateTo,
}: OwnerWithdrawalsReportTabProps) {
  const { data, isLoading, isError, error, refetch } =
    useOwnerWithdrawalsReport({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير السحوبات"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <StatCard
          title="عدد السحوبات"
          value={String(data.summary.count)}
          icon={TrendingDown}
        />
        <StatCard
          title="إجمالي المسحوب"
          value={formatMoney(data.summary.totalWithdrawn)}
          icon={Banknote}
          variant="destructive"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card print-area">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={TrendingDown}
            title="لا توجد سحوبات"
            description="لم تُسجَّل سحوبات في الفترة المحددة"
            className="border-0 bg-transparent"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">التاريخ</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="hidden sm:table-cell">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden sm:table-cell text-sm whitespace-nowrap">
                    {formatDateTime(row.date)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {row.reason}
                  </TableCell>
                  <TableCell className="num font-medium text-red-600">
                    {formatMoney(row.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === 'ACTIVE' ? 'success' : 'secondary'}
                    >
                      {row.status === 'ACTIVE' ? 'نشطة' : 'معكوسة'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                    {row.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Badge variant="secondary" className="text-xs">
        {data.rows.length} صف
      </Badge>
    </div>
  );
}
