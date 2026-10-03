import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface LinesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
  onStatusChange: (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
}

export function LinesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: LinesFiltersProps) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Search */}
      <div className="space-y-1 sm:col-span-2 lg:col-span-2">
        <Label className="text-xs">بحث</Label>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو المزود أو المعرّف..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1">
        <Label className="text-xs">الحالة</Label>
        <Select
          value={status}
          onValueChange={(v) =>
            onStatusChange(v as 'ALL' | 'ACTIVE' | 'INACTIVE')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="ACTIVE">مفعّل</SelectItem>
            <SelectItem value="INACTIVE">معطّل</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
