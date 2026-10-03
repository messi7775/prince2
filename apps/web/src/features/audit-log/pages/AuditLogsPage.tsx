import { useState } from 'react';
import type { AuditAction, AuditLog } from '@prince-net/types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { AuditLogsFilters } from '../components/AuditLogsFilters';
import { AuditLogsTable } from '../components/AuditLogsTable';
import { AuditLogDetailsDialog } from '../components/AuditLogDetailsDialog';
import { useAuditLogs } from '../hooks/useAuditLogs';

const PAGE_LIMIT = 25;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | 'ALL'>('ALL');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    limit: PAGE_LIMIT,
    search: search.trim() || undefined,
    action: action === 'ALL' ? undefined : action,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const resetFilters = () => {
    setSearch(''); setAction('ALL'); setEntityType(''); setDateFrom(''); setDateTo(''); setPage(1);
  };
  const change = <T,>(setter: (value: T) => void, value: T) => { setter(value); setPage(1); };

  return (
    <div className="space-y-5">
      <PageHeader title="سجل العمليات" description="سجل تدقيق مركزي للعمليات الحساسة والتغييرات التي تمت داخل النظام" />
      <AuditLogsFilters search={search} onSearchChange={(value) => change(setSearch, value)} action={action} onActionChange={(value) => change(setAction, value)} entityType={entityType} onEntityTypeChange={(value) => change(setEntityType, value)} dateFrom={dateFrom} onDateFromChange={(value) => change(setDateFrom, value)} dateTo={dateTo} onDateToChange={(value) => change(setDateTo, value)} onReset={resetFilters} />
      {isLoading ? <LoadingState /> : isError || !data ? <ErrorState title="تعذّر تحميل السجلات" message={error instanceof Error ? error.message : 'حدث خطأ'} onRetry={() => refetch()} /> : <AuditLogsTable data={data.data} page={page} totalPages={data.meta.totalPages} onPageChange={setPage} onViewDetails={(log: AuditLog) => setDetailsId(log.id)} />}
      <AuditLogDetailsDialog open={!!detailsId} onOpenChange={(open) => !open && setDetailsId(null)} auditLogId={detailsId} />
    </div>
  );
}
