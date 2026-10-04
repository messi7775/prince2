import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

/* فلترة وترتيب موحّدة لجداول الدفعات (فواتير المبيعات وخطوط الشبكة) */

export type PaymentStatusFilter = 'ALL' | 'ACTIVE' | 'REVERSED';
export type PaymentOrder = 'asc' | 'desc';

interface PaymentsListFiltersProps {
  status: PaymentStatusFilter;
  onStatusChange: (value: PaymentStatusFilter) => void;
  order: PaymentOrder;
  onOrderChange: (value: PaymentOrder) => void;
}

export function PaymentsListFilters({
  status,
  onStatusChange,
  order,
  onOrderChange,
}: PaymentsListFiltersProps) {
  return (
    <div className="grid gap-2 grid-cols-2 px-4 pt-4 pb-1">
      <div className="space-y-1">
        <Label className="text-xs">الحالة</Label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as PaymentStatusFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="ACTIVE">نشطة</SelectItem>
            <SelectItem value="REVERSED">معكوسة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">الترتيب</Label>
        <Select
          value={order}
          onValueChange={(v) => onOrderChange(v as PaymentOrder)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">الأحدث أولاً</SelectItem>
            <SelectItem value="asc">الأقدم أولاً</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
