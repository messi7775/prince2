import { useQuery } from '@tanstack/react-query';
import type { PaginationQuery } from '@prince-net/types';
import { listPackages } from '../api/list';

interface UsePackagesParams extends PaginationQuery {
  status?: 'ACTIVE' | 'INACTIVE';
}

export function usePackages(params: UsePackagesParams) {
  return useQuery({
    queryKey: ['packages', params],
    queryFn: () => listPackages(params),
    staleTime: 30_000,
  });
}