import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import type { CashMovement, CashSourceType } from '@prince-net/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { EmptyState } from '../../../components/ui/empty-state';
import { Pagination } from '../../../components/ui/pagination';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { cn } from '../../../lib/utils';

interface CashMovementsTableProps {
  data: CashMovement[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const SOURCE_TYPE_LABELS: Record<CashSourceType, string> = {
  OPENING: 'رصيد افتتاحي',
  SALE_PAYMENT: 'دفعة بيع',
  SALE_PAYMENT_REVERSAL: 'عكس دفعة بيع',
  EXPENSE: 'مصروف',
  EXPENSE_REVERSAL: 'عكس مصروف',
  LINE_PAYMENT: 'دفعة خط',
  LINE_PAYMENT_REVERSAL: 'عكس دفعة خط',
  OWNER_WITHDRAWAL: 'سحب المالك',
  OWNER_WITHDRAWAL_REVERSAL: 'عكس سحب المالك',
  MANUAL: 'يدوي',
};

export function CashMovementsTable({
  data,
  page,
  totalPages,
  onPageChange,
}: CashMovementsTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="لا توجد حركات"
        description="لم تُسجَّل أي حركة نقدية بعد"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>الاتجاه</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead className="hidden sm:table-cell">المصدر</TableHead>
              <TableHead className="hidden md:table-cell">الوصف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((mv) => {
              const isIn = mv.direction === 'IN';

              return (
                <TableRow key={mv.id}>
                  <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                    {formatDateTime(mv.movementDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isIn ? 'success' : 'destructive'}>
                      <span className="flex items-center gap-1">
                        {isIn ? (
                          <ArrowDownCircle className="h-3 w-3" />
                        ) : (
                          <ArrowUpCircle className="h-3 w-3" />
                        )}
                        {isIn ? 'وارد' : 'صادر'}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'num font-medium',
                      isIn ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {isIn ? '+' : '-'}
                    {formatMoney(mv.amount)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {SOURCE_TYPE_LABELS[mv.sourceType]}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[280px] truncate">
                    {mv.description ?? '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}