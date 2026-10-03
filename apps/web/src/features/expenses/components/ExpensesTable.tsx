import { MoreHorizontal, Pencil, Printer, Trash2, TrendingDown } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@prince-net/types';
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

interface ExpensesTableProps {
  data: Expense[];
  categories: ExpenseCategory[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onPrint: (expense: Expense) => void;
}

export function ExpensesTable({
  data,
  categories,
  onEdit,
  onDelete,
  onPrint,
}: ExpensesTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={TrendingDown}
        title="لا توجد مصروفات"
        description="ابدأ بإضافة مصروف جديد"
      />
    );
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            <TableHead>التصنيف</TableHead>
            <TableHead className="hidden sm:table-cell">الوصف</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((expense) => {
            const category = categoryMap.get(expense.categoryId);
            const isActive = expense.status === 'ACTIVE';

            return (
              <TableRow key={expense.id}>
                <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                  {formatDate(expense.expenseDate)}
                </TableCell>
                <TableCell className="text-sm">
                  {category?.name ?? '—'}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm max-w-[280px] truncate">
                  {expense.description}
                </TableCell>
                <TableCell className="num font-medium">
                  {formatMoney(expense.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={isActive ? 'success' : 'secondary'}>
                    {isActive ? 'نشط' : 'معكوس'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPrint(expense)}>
                        <Printer className="me-2 h-4 w-4" />
                        طباعة
                      </DropdownMenuItem>
                      {isActive && (
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Pencil className="me-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                      )}
                      {isActive && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(expense)}
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
