import { useQuery } from '@tanstack/react-query';
import { getAuditLog } from '../api/get';

export function useAuditLog(id: string | null | undefined) {
  return useQuery({
    queryKey: ['audit-logs', id],
    queryFn: () => getAuditLog(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
