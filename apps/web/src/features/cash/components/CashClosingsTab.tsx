import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { Pagination } from '../../../components/ui/pagination';
import { formatMoney } from '../../../lib/currency';
import { formatShortDate, formatDateTime } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { useCashClosings } from '../hooks/useCashClosings';
import { CashClosingDialog } from './CashClosingDialog';

const PAGE_LIMIT = 15;

export function CashClosingsTab() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const closingsQuery = useCashClosings({ page, limit: PAGE_LIMIT });

  return (
    <div className="space-y-4">
      <div data-print-exclude className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Lock className="me-2 h-4 w-4" />
          إغلاق يوم
        </Button>
      </div>

      {closingsQuery.isLoading ? (
        <LoadingState />
      ) : !closingsQuery.data || closingsQuery.data.data.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="لا توجد إغلاقات"
          description="لم يتم إغلاق أي يوم بعد — الإغلاق اليومي يجمد لقطة الصندوق للمراجعة"
        />
      ) : (
        <>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاريخ الإغلاق</TableHead>
                  <TableHead className="hidden sm:table-cell">افتتاحي</TableHead>
                  <TableHead className="hidden sm:table-cell">وارد</TableHead>
                  <TableHead className="hidden sm:table-cell">صادر</TableHead>
                  <TableHead>المتوقع</TableHead>
                  <TableHead>الفعلي</TableHead>
                  <TableHead>الفرق</TableHead>
                  <TableHead className="hidden sm:table-cell">أُغلق في</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closingsQuery.data.data.map((c) => {
                  const hasDiff = c.difference !== '0.00' && c.difference !== '0';
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="num font-medium">
                        {formatShortDate(c.closingDate)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell num">
                        {formatMoney(c.openingBalance)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell num text-green-600">
                        {formatMoney(c.totalIn)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell num text-destructive">
                        {formatMoney(c.totalOut)}
                      </TableCell>
                      <TableCell className="num">
                        {formatMoney(c.expectedBalance)}
                      </TableCell>
                      <TableCell className="num">
                        {formatMoney(c.actualBalance)}
                      </TableCell>
                      <TableCell className="num">
                        {hasDiff ? (
                          <Badge variant="destructive">
                            {formatMoney(c.difference)}
                          </Badge>
                        ) : (
                          <Badge variant="success">متطابق</Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'hidden sm:table-cell text-sm text-muted-foreground',
                        )}
                      >
                        {formatDateTime(c.closedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {closingsQuery.data.meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={closingsQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <CashClosingDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
