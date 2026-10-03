import { useQuery } from '@tanstack/react-query';
import { getExpense } from '../api/get';

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => getExpense(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
