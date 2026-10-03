import { Label } from '../../../components/ui/label';
import { DateFilterInput } from '../../../components/ui/date-filter-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface OwnerWithdrawalsFiltersProps {
  status: 'ALL' | 'ACTIVE' | 'REVERSED';
  onStatusChange: (value: 'ALL' | 'ACTIVE' | 'REVERSED') => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export function OwnerWithdrawalsFilters({
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: OwnerWithdrawalsFiltersProps) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
      <div className="space-y-1">
        <Label className="text-xs">الحالة</Label>
        <Select
          value={status}
          onValueChange={(v) =>
            onStatusChange(v as 'ALL' | 'ACTIVE' | 'REVERSED')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="ACTIVE">نشط</SelectItem>
            <SelectItem value="REVERSED">معكوس</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs" htmlFor="owDateFrom">
          من تاريخ
        </Label>
        <DateFilterInput
          value={dateFrom}
          onChange={onDateFromChange}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs" htmlFor="owDateTo">
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
