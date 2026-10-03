import { CreditCard, MoreHorizontal } from 'lucide-react';
import type { LinePayment } from '@prince-net/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { EmptyState } from '../../../components/ui/empty-state';
import { Pagination } from '../../../components/ui/pagination';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';

interface LinePaymentsTableProps {
  data: LinePayment[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onReverse: (payment: LinePayment) => void;
}

export function LinePaymentsTable({
  data,
  page,
  totalPages,
  onPageChange,
  onReverse,
}: LinePaymentsTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="لا توجد دفعات"
        description="لم تُسجَّل أي دفعة لهذا الخط"
        className="border-0 bg-transparent"
      />
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead className="hidden sm:table-cell">الفترة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="hidden md:table-cell">ملاحظات</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((payment) => {
            const isActive = payment.status === 'ACTIVE';

            return (
              <TableRow key={payment.id}>
                <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                  {formatDateTime(payment.paymentDate)}
                </TableCell>
                <TableCell className="num font-medium">
                  {formatMoney(payment.amount)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{payment.period}</TableCell>
                <TableCell>
                  <Badge variant={isActive ? 'success' : 'secondary'}>
                    {isActive ? 'نشطة' : 'معكوسة'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[240px] truncate">
                  {payment.reversalReason
                    ? `معكوسة: ${payment.reversalReason}`
                    : (payment.notes ?? '—')}
                </TableCell>
                <TableCell>
                  {isActive && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onReverse(payment)}
                        >
                          عكس الدفعة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
