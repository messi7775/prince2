import { useQuery } from '@tanstack/react-query';
import { fetchExpensesReport } from '../api/expenses';

interface UseExpensesReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export function useExpensesReport(params: UseExpensesReportParams) {
  return useQuery({
    queryKey: ['reports', 'expenses', params],
    queryFn: () => fetchExpensesReport(params),
    staleTime: 60_000,
  });
}
