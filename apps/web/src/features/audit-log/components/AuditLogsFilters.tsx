import type { AuditAction } from '@prince-net/types';
import { Search, RotateCcw } from 'lucide-react';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { DateFilterInput } from '../../../components/ui/date-filter-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { AUDIT_ACTIONS, ENTITY_TYPE_LABELS } from '../../../lib/audit-actions';

interface AuditLogsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  action: AuditAction | 'ALL';
  onActionChange: (value: AuditAction | 'ALL') => void;
  entityType: string;
  onEntityTypeChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onReset: () => void;
}

export function AuditLogsFilters({ search, onSearchChange, action, onActionChange, entityType, onEntityTypeChange, dateFrom, onDateFromChange, dateTo, onDateToChange, onReset }: AuditLogsFiltersProps) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-sm font-semibold">تصفية السجلات</h2><p className="text-xs text-muted-foreground">ابحث وضيّق النتائج حسب العملية أو النوع أو التاريخ</p></div>
        <Button type="button" variant="ghost" size="sm" onClick={onReset} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" />مسح الفلاتر</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1 lg:col-span-2"><Label className="text-xs">بحث</Label><div className="relative"><Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="بريد المستخدم أو نوع السجل أو المعرّف..." className="ps-9" /></div></div>
        <div className="space-y-1"><Label className="text-xs">العملية</Label><Select value={action} onValueChange={(value) => onActionChange(value as AuditAction | 'ALL')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-72"><SelectItem value="ALL">كل العمليات</SelectItem>{AUDIT_ACTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs">نوع السجل</Label><Select value={entityType || 'ALL'} onValueChange={(value) => onEntityTypeChange(value === 'ALL' ? '' : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-72"><SelectItem value="ALL">كل الأنواع</SelectItem>{Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1"><div className="space-y-1"><Label className="text-xs">من</Label><DateFilterInput value={dateFrom} onChange={onDateFromChange} /></div><div className="space-y-1"><Label className="text-xs">إلى</Label><DateFilterInput value={dateTo} onChange={onDateToChange} /></div></div>
      </div>
    </div>
  );
}
