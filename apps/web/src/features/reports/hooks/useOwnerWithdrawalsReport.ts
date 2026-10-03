import { useQuery } from '@tanstack/react-query';
import { fetchOwnerWithdrawalsReport } from '../api/owner-withdrawals';

interface UseOwnerWithdrawalsReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export function useOwnerWithdrawalsReport(
  params: UseOwnerWithdrawalsReportParams,
) {
  return useQuery({
    queryKey: ['reports', 'owner-withdrawals', params],
    queryFn: () => fetchOwnerWithdrawalsReport(params),
    staleTime: 60_000,
  });
}
