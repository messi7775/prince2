import { useQuery } from '@tanstack/react-query';
import { fetchDistributorsReport, type DistributorPerformanceParams } from '../api/distributors';

export function useDistributorsReport(params: DistributorPerformanceParams = {}) {
  return useQuery({
    queryKey: ['reports', 'distributors', params],
    queryFn: () => fetchDistributorsReport(params),
    staleTime: 60_000,
  });
}
