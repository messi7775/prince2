import { MoreHorizontal, Layers } from 'lucide-react';
import type { PackageStockSummary } from '@prince-net/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { EmptyState } from '../../../components/ui/empty-state';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';

interface BatchesTableProps {
  data: PackageStockSummary[];
  onAdjust: (batch: PackageStockSummary) => void;
  onReturn: (batch: PackageStockSummary) => void;
  onEdit: (batch: PackageStockSummary) => void;
  onDelete: (batch: PackageStockSummary) => void;
}

export function BatchesTable({
  data,
  onAdjust,
  onReturn,
  onEdit,
  onDelete,
}: BatchesTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="لا توجد دفعات"
        description="لم تُضف أي دفعة لهذه الباقة بعد"
      />
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>تاريخ الاستلام</TableHead>
            <TableHead>سعر الشدة</TableHead>
            <TableHead>كمية الشدات</TableHead>
            <TableHead className="hidden sm:table-cell">ملاحظات</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="text-sm">
                {formatDate(batch.receivedAt)}
              </TableCell>
              <TableCell className="num">
                {formatMoney(batch.unitPrice)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    batch.currentQuantity <= 0
                      ? 'secondary'
                      : batch.currentQuantity <= 10
                        ? 'warning'
                        : 'success'
                  }
                >
                  {batch.currentQuantity}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                {batch.notes ?? '—'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(batch)}>
                      تعديل السعر والملاحظات
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAdjust(batch)}>
                      تعديل الكمية
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReturn(batch)}>
                      إعادة كروت
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(batch)}
                      disabled={batch.currentQuantity !== 0}
                    >
                      حذف الدفعة
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