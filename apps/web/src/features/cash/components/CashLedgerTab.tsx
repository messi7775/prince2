import { useRef, useState } from 'react';
import { BookOpen, Share2 } from 'lucide-react';
import type { CashSourceType } from '@prince-net/types';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
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
import { cashSourceLabel } from '../../../lib/cash-source-labels';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { useCashLedger } from '../hooks/useCashLedger';

const SOURCE_TYPE_OPTIONS: CashSourceType[] = [
  'OPENING',
  'SALE_PAYMENT',
  'SALE_PAYMENT_REVERSAL',
  'EXPENSE',
  'EXPENSE_REVERSAL',
  'LINE_PAYMENT',
  'LINE_PAYMENT_REVERSAL',
  'OWNER_WITHDRAWAL',
  'OWNER_WITHDRAWAL_REVERSAL',
  'MANUAL',
];

export function CashLedgerTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceType, setSourceType] = useState<CashSourceType | 'ALL'>('ALL');
  const [direction, setDirection] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { shareElement } = useSharePdf();

  const ledgerQuery = useCashLedger({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sourceType: sourceType === 'ALL' ? undefined : sourceType,
    direction: direction === 'ALL' ? undefined : direction,
    search: search || undefined,
    order,
  });

  const handleSharePdf = async () => {
    if (!contentRef.current || isSharingPdf) return;
    setIsSharingPdf(true);
    try {
      await shareElement(
        contentRef.current,
        `الدفتر-المالي-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } finally {
      setIsSharingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1">
          <Label className="text-xs">من تاريخ</Label>
          <DateFilterInput value={dateFrom} onChange={setDateFrom} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">إلى تاريخ</Label>
          <DateFilterInput value={dateTo} onChange={setDateTo} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">المصدر</Label>
          <Select
            value={sourceType}
            onValueChange={(v) => setSourceType(v as CashSourceType | 'ALL')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">الكل</SelectItem>
              {SOURCE_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {cashSourceLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">الاتجاه</Label>
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as 'ALL' | 'IN' | 'OUT')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">الكل</SelectItem>
              <SelectItem value="IN">وارد</SelectItem>
              <SelectItem value="OUT">صادر</SelectItem>
            </SelectContent>
          </Select>
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
        <div className="space-y-1">
          <Label className="text-xs">بحث</Label>
          <Input
            type="search"
            placeholder="وصف أو مرجع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div data-print-exclude className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSharePdf}
          disabled={isSharingPdf || !ledgerQuery.data}
        >
          <Share2 className="me-2 h-4 w-4" />
          {isSharingPdf ? 'جارٍ الإنشاء...' : 'مشاركة PDF'}
        </Button>
      </div>

      {ledgerQuery.isLoading ? (
        <LoadingState />
      ) : ledgerQuery.isError || !ledgerQuery.data ? (
        <ErrorState
          title="تعذّر تحميل الدفتر المالي"
          message={
            ledgerQuery.error instanceof Error
              ? ledgerQuery.error.message
              : 'حدث خطأ'
          }
          onRetry={() => ledgerQuery.refetch()}
        />
      ) : (
        <div ref={contentRef} className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="sm:pt-6">
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">افتتاحي الفترة</p>
                  <p className="num text-lg font-bold">
                    {formatMoney(ledgerQuery.data.summary.opening)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">إجمالي الوارد</p>
                  <p className="num text-lg font-bold text-green-600">
                    {formatMoney(ledgerQuery.data.summary.totalIn)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">إجمالي الصادر</p>
                  <p className="num text-lg font-bold text-destructive">
                    {formatMoney(ledgerQuery.data.summary.totalOut)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ختامي الفترة</p>
                  <p className="num text-lg font-bold">
                    {formatMoney(ledgerQuery.data.summary.closing)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries */}
          {ledgerQuery.data.entries.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="لا توجد حركات"
              description="لا توجد حركات مطابقة للفلاتر المحددة"
            />
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead className="hidden sm:table-cell">المرجع</TableHead>
                    <TableHead className="hidden sm:table-cell">الوصف</TableHead>
                    <TableHead>وارد</TableHead>
                    <TableHead>صادر</TableHead>
                    <TableHead>الرصيد بعد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerQuery.data.entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                        {formatDateTime(e.date)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.sourceLabel}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {e.referenceUrl ? (
                          <a
                            href={e.referenceUrl}
                            className="hover:underline num"
                          >
                            {e.reference}
                          </a>
                        ) : (
                          (e.reference ?? '—')
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                        {e.description ?? '—'}
                      </TableCell>
                      <TableCell className="num text-green-600">
                        {e.in !== '0.00' ? formatMoney(e.in) : '—'}
                      </TableCell>
                      <TableCell className="num text-destructive">
                        {e.out !== '0.00' ? formatMoney(e.out) : '—'}
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
