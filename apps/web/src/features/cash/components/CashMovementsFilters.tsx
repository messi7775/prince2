import type { CashSourceType } from '@prince-net/types';
import { Label } from '../../../components/ui/label';
import { DateFilterInput } from '../../../components/ui/date-filter-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface CashMovementsFiltersProps {
  direction: 'ALL' | 'IN' | 'OUT';
  onDirectionChange: (v: 'ALL' | 'IN' | 'OUT') => void;
  sourceType: CashSourceType | 'ALL';
  onSourceTypeChange: (v: CashSourceType | 'ALL') => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
}

const SOURCE_TYPE_OPTIONS: Array<{
  value: CashSourceType;
  label: string;
}> = [
  { value: 'OPENING', label: 'رصيد افتتاحي' },
  { value: 'SALE_PAYMENT', label: 'دفعة بيع' },
  { value: 'SALE_PAYMENT_REVERSAL', label: 'عكس دفعة بيع' },
  { value: 'EXPENSE', label: 'مصروف' },
  { value: 'EXPENSE_REVERSAL', label: 'عكس مصروف' },
  { value: 'LINE_PAYMENT', label: 'دفعة خط' },
  { value: 'LINE_PAYMENT_REVERSAL', label: 'عكس دفعة خط' },
  { value: 'OWNER_WITHDRAWAL', label: 'سحب المالك' },
  { value: 'OWNER_WITHDRAWAL_REVERSAL', label: 'عكس سحب المالك' },
  { value: 'MANUAL', label: 'يدوي' },
];

export function CashMovementsFilters({
  direction,
  onDirectionChange,
  sourceType,
  onSourceTypeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: CashMovementsFiltersProps) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs">الاتجاه</Label>
        <Select
          value={direction}
          onValueChange={(v) => onDirectionChange(v as 'ALL' | 'IN' | 'OUT')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="IN">وارد</SelectItem>
            <SelectItem value="OUT">صادر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">المصدر</Label>
        <Select
          value={sourceType}
          onValueChange={(v) => onSourceTypeChange(v as CashSourceType | 'ALL')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs" htmlFor="cashDateFrom">
          من تاريخ
        </Label>
        <DateFilterInput
          value={dateFrom}
          onChange={onDateFromChange}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs" htmlFor="cashDateTo">
          إلى تاريخ
        </Label>
        <DateFilterInput
          value={dateTo}
          onChange={onDateToChange}
        />
      </div>
    </div>
  );
}