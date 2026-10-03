import { Wifi } from 'lucide-react';
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
import { useLinesReport } from '../hooks/useLinesReport';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';

export function LinesReportTab() {
  const { data, isLoading, isError, error, refetch } = useLinesReport();

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير الخطوط"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  if (data.rows.length === 0) {
    return (
      <EmptyState
        icon={Wifi}
        title="لا توجد خطوط"
        description="لم تُسجَّل أي خطوط"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الخط</TableHead>
              <TableHead>إجمالي الدفعات</TableHead>
              <TableHead className="hidden sm:table-cell">آخر دفعة</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.lineId}>
                <TableCell className="font-medium">{row.lineName}</TableCell>
                <TableCell className="num">
                  {formatMoney(row.totalPayments)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {row.lastPaymentDate
                    ? formatDate(row.lastPaymentDate)
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={row.status === 'ACTIVE' ? 'success' : 'secondary'}
                  >
                    {row.status === 'ACTIVE' ? 'مفعّل' : 'معطّل'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Badge variant="secondary" className="text-xs">
        {data.rows.length} خط
      </Badge>
    </div>
  );
}
