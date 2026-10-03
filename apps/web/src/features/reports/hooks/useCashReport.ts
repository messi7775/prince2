import { useQuery } from '@tanstack/react-query';
import { fetchCashReport } from '../api/cash';

interface UseCashReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export function useCashReport(params: UseCashReportParams) {
  return useQuery({
    queryKey: ['reports', 'cash', params],
    queryFn: () => fetchCashReport(params),
    staleTime: 60_000,
  });
}
