import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Share2 } from 'lucide-react';
import type { DistributorStatementEntryType } from '@prince-net/types';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { DateFilterInput } from '../../../components/ui/date-filter-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { Card, CardContent } from '../../../components/ui/card';
import { useSharePdf } from '../../../lib/use-share-pdf';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { useDistributorStatement } from '../hooks/useDistributorStatement';

const ENTRY_TYPE_LABELS: Record<DistributorStatementEntryType, string> = {
  SALE: 'فاتورة',
  PAYMENT: 'دفعة',
  SALE_CANCELLED: 'إلغاء فاتورة',
  PAYMENT_REVERSED: 'عكس دفعة',
};

function entryTypeBadgeVariant(
  type: DistributorStatementEntryType,
): 'default' | 'success' | 'destructive' | 'secondary' {
  switch (type) {
    case 'SALE':
      return 'default';
    case 'PAYMENT':
      return 'success';
    case 'SALE_CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

interface DistributorStatementTabProps {
  distributorId: string;
  distributorName: string;
}

export function DistributorStatementTab({
  distributorId,
  distributorName,
}: DistributorStatementTabProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { shareElement } = useSharePdf();

  const statementQuery = useDistributorStatement(distributorId, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    order,
  });

  const handleSharePdf = async () => {
    if (!contentRef.current || isSharingPdf) return;
    setIsSharingPdf(true);
    try {
      await shareElement(
        contentRef.current,
        `كشف-${distributorName}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } finally {
      setIsSharingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">من تاريخ</Label>
          <DateFilterInput value={dateFrom} onChange={setDateFrom} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">إلى تاريخ</Label>
          <DateFilterInput value={dateTo} onChange={setDateTo} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">الترتيب</Label>
          <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">الأحدث أولًا</SelectItem>
              <SelectItem value="asc">الأقدم أولًا</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div data-print-exclude className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSharePdf}
          disabled={isSharingPdf || !statementQuery.data}
        >
          <Share2 className="me-2 h-4 w-4" />
          {isSharingPdf ? 'جارٍ الإنشاء...' : 'مشاركة PDF'}
        </Button>
      </div>

      {statementQuery.isLoading ? (
        <LoadingState />
      ) : statementQuery.isError || !statementQuery.data ? (
        <ErrorState
          title="تعذّر تحميل كشف الحساب"
          message={
            statementQuery.error instanceof Error
              ? statementQuery.error.message
              : 'حدث خطأ'
          }
          onRetry={() => statementQuery.refetch()}
        />
      ) : (
        <div ref={contentRef} className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="sm:pt-6">
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">رصيد افتتاحي</p>
                  <p className="num text-lg font-bold">
                    {formatMoney(statementQuery.data.summary.openingBalance)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">إجمالي عليه</p>
                  <p className="num text-lg font-bold text-destructive">
                    {formatMoney(statementQuery.data.summary.totalDebit)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">إجمالي له</p>
                  <p className="num text-lg font-bold text-green-600">
                    {formatMoney(statementQuery.data.summary.totalCredit)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">الرصيد الختامي</p>
                  <p className="num text-lg font-bold">
                    {formatMoney(statementQuery.data.summary.closingBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries */}
          {statementQuery.data.entries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد حركات"
              description="لا توجد حركات في هذه الفترة"
            />
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المرجع</TableHead>
                    <TableHead className="hidden sm:table-cell">عليه</TableHead>
                    <TableHead className="hidden sm:table-cell">له</TableHead>
                    <TableHead>الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statementQuery.data.entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                        {formatDateTime(e.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entryTypeBadgeVariant(e.entryType)}>
                          {ENTRY_TYPE_LABELS[e.entryType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={e.referenceUrl}
                          className="hover:underline num text-sm"
                        >
                          {e.reference}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell num text-destructive">
                        {e.debit !== '0.00' ? formatMoney(e.debit) : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell num text-green-600">
                        {e.credit !== '0.00' ? formatMoney(e.credit) : '—'}
                      </TableCell>
                      <TableCell className="num font-medium">
                        {formatMoney(e.balanceAfter)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
