import { Label } from '../../../components/ui/label';
import { DateFilterInput } from '../../../components/ui/date-filter-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useExpenseCategories } from '../../expense-categories/hooks/useExpenseCategories';

interface ExpensesFiltersProps {
  categoryId: string;
  onCategoryChange: (value: string) => void;
  status: 'ALL' | 'ACTIVE' | 'REVERSED';
  onStatusChange: (value: 'ALL' | 'ACTIVE' | 'REVERSED') => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export function ExpensesFilters({
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: ExpensesFiltersProps) {
  const categoriesQuery = useExpenseCategories();
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs">التصنيف</Label>
        <Select
          value={categoryId || 'ALL'}
          onValueChange={(v) => onCategoryChange(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {!c.isActive ? ' (معطّل)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <Label className="text-xs" htmlFor="expDateFrom">
          من تاريخ
        </Label>
        <DateFilterInput
          value={dateFrom}
          onChange={onDateFromChange}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs" htmlFor="expDateTo">
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
