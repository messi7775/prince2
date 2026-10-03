import { useQuery } from '@tanstack/react-query';
import { getPackage } from '../api/get';

export function usePackage(id: string | undefined) {
  return useQuery({
    queryKey: ['packages', id],
    queryFn: () => getPackage(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}