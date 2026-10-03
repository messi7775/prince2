import { Package } from 'lucide-react';
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
import { useInventoryReport } from '../hooks/useInventoryReport';

interface InventoryReportTabProps {
  dateFrom: string;
  dateTo: string;
}

export function InventoryReportTab({
  dateFrom,
  dateTo,
}: InventoryReportTabProps) {
  const { data, isLoading, isError, error, refetch } = useInventoryReport({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير المخزون"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  if (data.rows.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="لا توجد بيانات"
        description="لم تُسجَّل حركات مخزون في الفترة المحددة"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الباقة</TableHead>
              <TableHead className="hidden md:table-cell">افتتاحي</TableHead>
              <TableHead className="hidden sm:table-cell">إضافة</TableHead>
              <TableHead className="hidden sm:table-cell">بيع</TableHead>
              <TableHead className="hidden md:table-cell">إعادة</TableHead>
              <TableHead className="hidden lg:table-cell">تعديل</TableHead>
              <TableHead>الحالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.packageId}>
                <TableCell className="font-medium">
                  {row.packageName}
                </TableCell>
                <TableCell className="hidden md:table-cell num">{row.opening}</TableCell>
                <TableCell className="hidden sm:table-cell num text-green-600">
                  +{row.added}
                </TableCell>
                <TableCell className="hidden sm:table-cell num text-red-600">
                  -{row.sold}
                </TableCell>
                <TableCell className="hidden md:table-cell num text-green-600">
                  +{row.returned}
                </TableCell>
                <TableCell className="hidden lg:table-cell num">
                  {row.adjusted >= 0 ? '+' : ''}
                  {row.adjusted}
                </TableCell>
                <TableCell className="num font-bold">{row.current}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Badge variant="secondary" className="text-xs">
        {data.rows.length} باقة
      </Badge>
    </div>
  );
}
