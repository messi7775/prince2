import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
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
import { useCashReport } from '../hooks/useCashReport';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { cashSourceLabel } from '../../../lib/cash-source-labels';
import { cn } from '../../../lib/utils';

interface CashReportTabProps {
  dateFrom: string;
  dateTo: string;
}

export function CashReportTab({ dateFrom, dateTo }: CashReportTabProps) {
  const { data, isLoading, isError, error, refetch } = useCashReport({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير الصندوق"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="الرصيد الافتتاحي"
          value={formatMoney(data.summary.opening)}
          icon={Wallet}
        />
        <StatCard
          title="إجمالي الوارد"
          value={formatMoney(data.summary.totalIn)}
          icon={ArrowDownCircle}
          variant="success"
        />
        <StatCard
          title="إجمالي الصادر"
          value={formatMoney(data.summary.totalOut)}
          icon={ArrowUpCircle}
          variant="destructive"
        />
        <StatCard
          title="الرصيد الختامي"
          value={formatMoney(data.summary.closing)}
          icon={Wallet}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="لا توجد حركات"
            description="لم تُسجَّل حركات في الفترة المحددة"
            className="border-0 bg-transparent"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الاتجاه</TableHead>
                <TableHead className="hidden sm:table-cell">المصدر</TableHead>
                <TableHead className="hidden md:table-cell">الوصف</TableHead>
                <TableHead>المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDateTime(row.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.direction === 'IN' ? 'success' : 'destructive'}
                    >
                      {row.direction === 'IN' ? 'وارد' : 'صادر'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{cashSourceLabel(row.sourceType)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[240px] truncate">
                    {row.description || '—'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'num font-medium',
                      row.direction === 'IN'
                        ? 'text-green-600'
                        : 'text-red-600',
                    )}
                  >
                    {row.direction === 'IN' ? '+' : '-'}
                    {formatMoney(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Badge variant="secondary" className="text-xs">
        {data.rows.length} حركة
      </Badge>
    </div>
  );
}
