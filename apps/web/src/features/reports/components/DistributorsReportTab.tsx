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

export function DistributorsReportTab() {
  const { data, isLoading, isError, error, refetch } =
    useDistributorsReport();

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
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الموزع</TableHead>
              <TableHead className="hidden sm:table-cell">إجمالي المبيعات</TableHead>
              <TableHead className="hidden sm:table-cell">إجمالي الدفعات</TableHead>
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
                    {row.distributorName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell num">
                    {formatMoney(row.totalSales)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell num">
                    {formatMoney(row.totalPayments)}
                  </TableCell>
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
