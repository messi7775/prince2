import { useQuery } from '@tanstack/react-query';
import type { PaginationQuery } from '@prince-net/types';
import { listLines } from '../api/list';

interface UseLinesParams extends PaginationQuery {
  status?: 'ACTIVE' | 'INACTIVE';
}

export function useLines(params: UseLinesParams) {
  return useQuery({
    queryKey: ['lines', params],
    queryFn: () => listLines(params),
    staleTime: 30_000,
  });
}