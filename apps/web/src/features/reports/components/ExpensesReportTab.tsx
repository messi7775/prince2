import { TrendingDown } from 'lucide-react';
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
import { useExpensesReport } from '../hooks/useExpensesReport';
import { formatMoney } from '../../../lib/currency';

interface ExpensesReportTabProps {
  dateFrom: string;
  dateTo: string;
}

export function ExpensesReportTab({
  dateFrom,
  dateTo,
}: ExpensesReportTabProps) {
  const { data, isLoading, isError, error, refetch } = useExpensesReport({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير المصروفات"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  if (data.rows.length === 0) {
    return (
      <EmptyState
        icon={TrendingDown}
        title="لا توجد مصروفات"
        description="لم تُسجَّل مصروفات في الفترة المحددة"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التصنيف</TableHead>
              <TableHead>العدد</TableHead>
              <TableHead>الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.categoryId}>
                <TableCell className="font-medium">
                  {row.categoryName}
                </TableCell>
                <TableCell className="num">{row.count}</TableCell>
                <TableCell className="num font-medium">
                  {formatMoney(row.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Badge variant="secondary" className="text-xs">
        {data.rows.length} تصنيف
      </Badge>
    </div>
  );
}
