import { useQuery } from '@tanstack/react-query';
import { getLine } from '../api/get';

export function useLine(id: string | undefined) {
  return useQuery({
    queryKey: ['lines', id],
    queryFn: () => getLine(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}