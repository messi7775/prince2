import { Label } from '../../../components/ui/label';
import { DateFilterInput } from '../../../components/ui/date-filter-input';

interface ReportDateRangeProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function ReportDateRange({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: ReportDateRangeProps) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs" htmlFor="rptDateFrom">
          من تاريخ
        </Label>
        <DateFilterInput
          value={dateFrom}
          onChange={onDateFromChange}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs" htmlFor="rptDateTo">
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
