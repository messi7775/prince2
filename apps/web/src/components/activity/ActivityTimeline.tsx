import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingState } from '../ui/loading-state';
import { ErrorState } from '../ui/error-state';
import { Pagination } from '../ui/pagination';
import { listAuditLogs } from '../../features/audit-log/api/list';
import { formatDateTime } from '../../lib/format';
import { getAuditActionLabel } from '../../lib/audit-actions';

/** Audit-backed timeline; no second activity table or stored balances. */
export function ActivityTimeline({ entityType, entityId, userId, title = 'التسلسل الزمني' }: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const params = { entityType, entityId, userId, page, limit: 10 };
  const query = useQuery({ queryKey: ['audit-logs', 'timeline', params], queryFn: () => listAuditLogs(params), enabled: open });
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'إخفاء السجل' : 'عرض السجل'}</Button>
      </CardHeader>
      {open && <CardContent>
        {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState title="تعذّر تحميل السجل" onRetry={() => query.refetch()} /> : <>
          <ol className="space-y-3 border-s ps-4">
            {query.data?.data.map((log) => <li key={log.id} className="space-y-1 text-sm">
              <p className="font-medium">{getAuditActionLabel(log.action)}</p>
              <p className="break-words text-xs text-muted-foreground">{log.userEmail} · {formatDateTime(log.createdAt)}</p>
              <p className="text-xs text-muted-foreground">{log.entityType}</p>
            </li>)}
          </ol>
          {!query.data?.data.length && <p className="text-sm text-muted-foreground">لا توجد عمليات مسجلة</p>}
          {(query.data?.meta.totalPages ?? 0) > 1 && <Pagination page={page} totalPages={query.data!.meta.totalPages} onPageChange={setPage} />}
        </>}
      </CardContent>}
    </Card>
  );
}
