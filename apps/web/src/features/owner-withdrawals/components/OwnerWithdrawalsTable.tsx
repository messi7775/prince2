import { MoreHorizontal, Pencil, Printer, Trash2, Wallet } from 'lucide-react';
import type { OwnerWithdrawal } from '@prince-net/types';
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
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';

interface OwnerWithdrawalsTableProps {
  data: OwnerWithdrawal[];
  onEdit: (withdrawal: OwnerWithdrawal) => void;
  onDelete: (withdrawal: OwnerWithdrawal) => void;
  onPrint: (withdrawal: OwnerWithdrawal) => void;
}

export function OwnerWithdrawalsTable({
  data,
  onEdit,
  onDelete,
  onPrint,
}: OwnerWithdrawalsTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="لا توجد سحوبات"
        description="لم تُسجَّل أي سحوبات للمالك بعد"
      />
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            <TableHead>السبب</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="hidden md:table-cell">ملاحظات</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((w) => {
            const isActive = w.status === 'ACTIVE';

            return (
              <TableRow key={w.id}>
                <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                  {formatDate(w.withdrawalDate)}
                </TableCell>
                <TableCell className="font-medium sm:max-w-[240px] sm:truncate break-words">
                  {w.reason}
                </TableCell>
                <TableCell className="num font-medium">
                  {formatMoney(w.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={isActive ? 'success' : 'secondary'}>
                    {isActive ? 'نشط' : 'معكوس'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                  {w.notes ?? '—'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPrint(w)}>
                        <Printer className="me-2 h-4 w-4" />
                        طباعة
                      </DropdownMenuItem>
                      {isActive && (
                        <DropdownMenuItem onClick={() => onEdit(w)}>
                          <Pencil className="me-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                      )}
                      {isActive && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(w)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
