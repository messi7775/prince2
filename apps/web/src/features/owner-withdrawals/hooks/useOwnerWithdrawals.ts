import { useQuery } from '@tanstack/react-query';
import type { PaginationQuery } from '@prince-net/types';
import { listOwnerWithdrawals } from '../api/list';

interface UseOwnerWithdrawalsParams extends PaginationQuery {
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

export function useOwnerWithdrawals(params: UseOwnerWithdrawalsParams) {
  return useQuery({
    queryKey: ['owner-withdrawals', params],
    queryFn: () => listOwnerWithdrawals(params),
    staleTime: 30_000,
  });
}
