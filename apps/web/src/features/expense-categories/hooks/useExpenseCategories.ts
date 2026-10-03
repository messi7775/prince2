import { useQuery } from '@tanstack/react-query';
import { listExpenseCategories } from '../api/list';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: listExpenseCategories,
    staleTime: 60_000,
  });
}