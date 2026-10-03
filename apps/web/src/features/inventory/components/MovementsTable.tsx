import { History } from 'lucide-react';
import type { InventoryMovement } from '@prince-net/types';
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
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { cn } from '../../../lib/utils';

interface MovementsTableProps {
  data: InventoryMovement[];
}

const typeLabels: Record<InventoryMovement['type'], string> = {
  ADD: 'إضافة',
  SELL: 'بيع',
  RETURN: 'إعادة',
  ADJUSTMENT: 'تعديل',
};

const typeVariants: Record<
  InventoryMovement['type'],
  'default' | 'success' | 'warning' | 'secondary'
> = {
  ADD: 'success',
  SELL: 'default',
  RETURN: 'warning',
  ADJUSTMENT: 'secondary',
};

export function MovementsTable({ data }: MovementsTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="لا توجد حركات"
        description="لم تُسجَّل أي حركة مخزون بعد"
      />
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>التغيير</TableHead>
            <TableHead className="hidden sm:table-cell">سعر الشدة</TableHead>
            <TableHead className="hidden md:table-cell">الوصف</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((mv) => (
            <TableRow key={mv.id}>
              <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                {formatDateTime(mv.createdAt)}
              </TableCell>
              <TableCell>
                <Badge variant={typeVariants[mv.type]}>
                  {typeLabels[mv.type]}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(
                  'num font-semibold',
                  mv.quantityDelta > 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {mv.quantityDelta > 0 ? '+' : ''}
                {mv.quantityDelta}
              </TableCell>
              <TableCell className="hidden sm:table-cell num">
                {formatMoney(mv.unitPrice)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[280px]">
                {mv.description ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}