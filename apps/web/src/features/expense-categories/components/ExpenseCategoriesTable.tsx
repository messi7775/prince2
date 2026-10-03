import { MoreHorizontal, Tags } from 'lucide-react';
import type { ExpenseCategory } from '@prince-net/types';
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

interface ExpenseCategoriesTableProps {
  data: ExpenseCategory[];
  onEdit: (category: ExpenseCategory) => void;
  onDelete: (category: ExpenseCategory) => void;
  onToggleStatus: (category: ExpenseCategory) => void;
  isUpdating: boolean;
}

export function ExpenseCategoriesTable({
  data,
  onEdit,
  onDelete,
  onToggleStatus,
  isUpdating,
}: ExpenseCategoriesTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="لا توجد تصنيفات"
        description="ابدأ بإضافة تصنيف جديد"
      />
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead className="hidden sm:table-cell">الوصف</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[400px] truncate">
                {category.description ?? '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={category.isActive ? 'success' : 'secondary'}
                >
                  {category.isActive ? 'مفعّل' : 'معطّل'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isUpdating}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(category)}
                      className={
                        category.isActive
                          ? 'text-destructive'
                          : 'text-green-600'
                      }
                    >
                      {category.isActive ? 'تعطيل' : 'تفعيل'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(category)}
                      className="text-destructive"
                    >
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}