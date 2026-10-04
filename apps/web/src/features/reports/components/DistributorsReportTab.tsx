import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DistributorPerformanceParams } from '../api/distributors';
import { Users } from 'lucide-react';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
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
import { useDistributorsReport } from '../hooks/useDistributorsReport';
import { formatMoney } from '../../../lib/currency';
import { cn } from '../../../lib/utils';

export function DistributorsReportTab({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const [sortBy, setSortBy] = useState<DistributorPerformanceParams['sortBy']>('sales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, isError, error, refetch } =
    useDistributorsReport({ dateFrom, dateTo, sortBy, sortDir });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير الموزعين"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  if (data.rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="لا يوجد موزعون"
        description="لم تُسجَّل أي بيانات موزعين"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label>ترتيب الأداء <select aria-label="ترتيب الأداء" className="rounded-md border bg-background p-2" value={sortBy} onChange={(e) => setSortBy(e.target.value as DistributorPerformanceParams['sortBy'])}>
          <option value="sales">المبيعات</option><option value="payments">التحصيلات</option><option value="balance">الرصيد</option><option value="invoices">عدد الفواتير</option>
        </select></label>
        <label>الاتجاه <select aria-label="اتجاه ترتيب الأداء" className="rounded-md border bg-background p-2" value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}><option value="desc">تنازلي</option><option value="asc">تصاعدي</option></select></label>
      </div>
      <p className="text-xs text-muted-foreground">المبيعات والتحصيلات ضمن الفترة؛ الرصيد المستحق يشمل كامل التاريخ.</p>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الموزع</TableHead>
              <TableHead >إجمالي المبيعات</TableHead>
              <TableHead >إجمالي الدفعات</TableHead>
              <TableHead>عدد الفواتير</TableHead>
              <TableHead>متوسط الفاتورة</TableHead>
              <TableHead>الرصيد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => {
              const hasBalance =
                row.balance !== '0.00' && row.balance !== '0';

              return (
                <TableRow key={row.distributorId}>
                  <TableCell className="font-medium">
                    <Link className="hover:underline" to={`/distributors/${row.distributorId}`}>{row.distributorName}</Link>
                  </TableCell>
                  <TableCell className="num">
                    {formatMoney(row.totalSales)}
                  </TableCell>
                  <TableCell className="num">
                    {formatMoney(row.totalPayments)}
                  </TableCell>
                  <TableCell className="num">{row.invoiceCount}</TableCell>
                  <TableCell className="num">{formatMoney(row.avgInvoice ?? '0')}</TableCell>
                  <TableCell
                    className={cn(
                      'num font-medium',
                      hasBalance ? 'text-destructive' : 'text-green-600',
                    )}
                  >
                    {formatMoney(row.balance)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Badge variant="secondary" className="text-xs">
        {data.rows.length} موزع
      </Badge>
    </div>
  );
}
