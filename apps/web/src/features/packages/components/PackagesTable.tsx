import { MoreHorizontal, Package as PackageIcon } from 'lucide-react';
import type { PackageEntity } from '@prince-net/types';
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

interface PackagesTableProps {
  data: PackageEntity[];
  onEdit: (pkg: PackageEntity) => void;
  onToggleStatus: (pkg: PackageEntity) => void;
  isUpdating: boolean;
}

export function PackagesTable({
  data,
  onEdit,
  onToggleStatus,
  isUpdating,
}: PackagesTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PackageIcon}
        title="لا توجد باقات"
        description="ابدأ بإضافة باقة جديدة"
      />
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>سعر الكرت</TableHead>
            <TableHead className="hidden sm:table-cell">البيانات</TableHead>
            <TableHead className="hidden sm:table-cell">الساعات</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {pkg.color && (
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: pkg.color }}
                    />
                  )}
                  {pkg.name}
                </div>
              </TableCell>
              <TableCell className="num">
                {formatMoney(pkg.price)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{pkg.dataSizeMb} MB</TableCell>
              <TableCell className="hidden sm:table-cell">{pkg.hours} ساعة</TableCell>
              <TableCell>
                <Badge
                  variant={pkg.status === 'ACTIVE' ? 'success' : 'secondary'}
                >
                  {pkg.status === 'ACTIVE' ? 'مفعّلة' : 'معطّلة'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isUpdating}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(pkg)}>
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(pkg)}
                      className={
                        pkg.status === 'ACTIVE'
                          ? 'text-destructive'
                          : 'text-green-600'
                      }
                    >
                      {pkg.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
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