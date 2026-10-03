import { useQuery } from '@tanstack/react-query';
import type { PaginationQuery } from '@prince-net/types';
import { listExpenses } from '../api/list';

interface UseExpensesParams extends PaginationQuery {
  categoryId?: string;
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

export function useExpenses(params: UseExpensesParams) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => listExpenses(params),
    staleTime: 30_000,
  });
}
