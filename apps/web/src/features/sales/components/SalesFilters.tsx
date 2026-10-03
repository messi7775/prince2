import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { DateFilterInput } from '../../../components/ui/date-filter-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import { useDistributors } from '../../distributors/hooks/useDistributors';

interface SalesFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    status: 'ALL' | 'ACTIVE' | 'CANCELLED';
    onStatusChange: (value: 'ALL' | 'ACTIVE' | 'CANCELLED') => void;
    distributorId: string;
    onDistributorChange: (value: string) => void;
    dateFrom: string;
    onDateFromChange: (value: string) => void;
    dateTo: string;
    onDateToChange: (value: string) => void;
}

export function SalesFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    distributorId,
    onDistributorChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
}: SalesFiltersProps) {
    const distributorsQuery = useDistributors({
        page: 1,
        limit: 100,
        status: 'ACTIVE',
    });

    return (
        <div className= "grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" >
        {/* Search */ }
        < div className = "space-y-1 sm:col-span-2 xl:col-span-2" >
            <Label className="text-xs" > بحث </Label>
                < div className = "relative" >
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
            placeholder="ابحث برقم الفاتورة..."
    value = { search }
    onChange = {(e) => onSearchChange(e.target.value)
}
className = "ps-9"
    />
    </div>
    </div>

{/* Status */ }
<div className="space-y-1" >
    <Label className="text-xs" > الحالة </Label>
        < Select
value = { status }
onValueChange = {(v) =>
onStatusChange(v as 'ALL' | 'ACTIVE' | 'CANCELLED')
          }
        >
    <SelectTrigger>
    <SelectValue />
    </SelectTrigger>
    < SelectContent >
    <SelectItem value="ALL" > الكل </SelectItem>
        < SelectItem value = "ACTIVE" > نشطة </SelectItem>
            < SelectItem value = "CANCELLED" > ملغاة </SelectItem>
                </SelectContent>
                </Select>
                </div>

{/* Distributor */ }
<div className="space-y-1" >
    <Label className="text-xs" > الموزع </Label>
        < Select
value = { distributorId || 'ALL'}
onValueChange = {(v) => onDistributorChange(v === 'ALL' ? '' : v)}
        >
    <SelectTrigger>
    <SelectValue placeholder="الكل" />
        </SelectTrigger>
        < SelectContent >
        <SelectItem value="ALL" > كل الموزعين </SelectItem>
{
    distributorsQuery.data?.data.map((d) => (
        <SelectItem key= { d.id } value = { d.id } >
        { d.name }
        </SelectItem>
    ))
}
</SelectContent>
    </Select>
    </div>

{/* Date From */ }
<div className="space-y-1" >
    <Label className="text-xs" > من تاريخ </Label>
        < DateFilterInput
value = { dateFrom }
onChange = { onDateFromChange }
    />
    </div>

{/* Date To */ }
<div className="space-y-1" >
    <Label className="text-xs" > إلى تاريخ </Label>
        < DateFilterInput
value = { dateTo }
onChange = { onDateToChange }
    />
    </div>
    </div>
  );
}
