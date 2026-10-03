import { useState } from 'react';
import { Banknote, CreditCard, ShoppingCart } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { useSalesReport } from '../hooks/useSalesReport';
import { useDistributors } from '../../distributors/hooks/useDistributors';
import { usePackages } from '../../packages/hooks/usePackages';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';

interface SalesReportTabProps {
  dateFrom: string;
  dateTo: string;
}

export function SalesReportTab({ dateFrom, dateTo }: SalesReportTabProps) {
  const [distributorId, setDistributorId] = useState<string>('');
  const [packageId, setPackageId] = useState<string>('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>(
    'ACTIVE',
  );

  const distributorsQuery = useDistributors({
    page: 1,
    limit: 100,
    status: 'ACTIVE',
  });
  const packagesQuery = usePackages({
    page: 1,
    limit: 100,
    status: 'ACTIVE',
  });

  const { data, isLoading, isError, error, refetch } = useSalesReport({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    distributorId: distributorId || undefined,
    packageId: packageId || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        title="تعذّر تحميل تقرير المبيعات"
        message={error instanceof Error ? error.message : 'حدث خطأ'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">الموزع</Label>
          <Select
            value={distributorId || 'ALL'}
            onValueChange={(v) => setDistributorId(v === 'ALL' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">الكل</SelectItem>
              {distributorsQuery.data?.data.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">الباقة</Label>
          <Select
            value={packageId || 'ALL'}
            onValueChange={(v) => setPackageId(v === 'ALL' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">الكل</SelectItem>
              {packagesQuery.data?.data.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">الحالة</Label>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus(v as 'ALL' | 'ACTIVE' | 'CANCELLED')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">نشطة</SelectItem>
              <SelectItem value="CANCELLED">ملغاة</SelectItem>
              <SelectItem value="ALL">الكل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="عدد الفواتير"
          value={String(data.summary.salesCount)}
          icon={ShoppingCart}
        />
        <StatCard
          title="إجمالي المبيعات"
          value={formatMoney(data.summary.totalSales)}
          icon={ShoppingCart}
        />
        <StatCard
          title="المدفوع"
          value={formatMoney(data.summary.totalPaid)}
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="المتبقي"
          value={formatMoney(data.summary.totalRemaining)}
          icon={Banknote}
          variant="destructive"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="لا توجد بيانات"
            description="لم تُسجَّل مبيعات في الفترة المحددة"
            className="border-0 bg-transparent"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">التاريخ</TableHead>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead className="hidden md:table-cell">الموزع</TableHead>
                <TableHead className="hidden sm:table-cell">الباقة</TableHead>
                <TableHead className="hidden md:table-cell">الكمية</TableHead>
                <TableHead>الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow key={`${row.invoiceNumber}-${i}`}>
                  <TableCell className="hidden sm:table-cell text-sm whitespace-nowrap">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="num text-sm font-medium">
                    {row.invoiceNumber}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {row.distributorName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{row.packageName}</TableCell>
                  <TableCell className="hidden md:table-cell num">{row.quantity}</TableCell>
                  <TableCell className="num font-medium">
                    {formatMoney(row.total)}
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
