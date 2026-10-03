import { useQuery } from '@tanstack/react-query';
import type { AuditAction } from '@prince-net/types';
import { listAuditLogs } from '../api/list';

interface UseAuditLogsParams {
  page: number;
  limit: number;
  search?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditLogs(params: UseAuditLogsParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
    staleTime: 30_000,
  });
}
