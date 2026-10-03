import { useQuery } from '@tanstack/react-query';
import { fetchDistributorsReport } from '../api/distributors';

export function useDistributorsReport() {
  return useQuery({
    queryKey: ['reports', 'distributors'],
    queryFn: fetchDistributorsReport,
    staleTime: 60_000,
  });
}
