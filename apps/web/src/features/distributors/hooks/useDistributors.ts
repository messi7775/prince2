import { useQuery } from '@tanstack/react-query';
import type { PaginationQuery } from '@prince-net/types';
import { listDistributors } from '../api/list';

interface UseDistributorsParams extends PaginationQuery {
  status?: 'ACTIVE' | 'INACTIVE';
}

export function useDistributors(params: UseDistributorsParams) {
  return useQuery({
    queryKey: ['distributors', params],
    queryFn: () => listDistributors(params),
    staleTime: 30_000,
  });
}