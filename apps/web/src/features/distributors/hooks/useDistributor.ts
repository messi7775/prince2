import { useQuery } from '@tanstack/react-query';
import { getDistributor } from '../api/get';

export function useDistributor(id: string | undefined) {
  return useQuery({
    queryKey: ['distributors', id],
    queryFn: () => getDistributor(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}