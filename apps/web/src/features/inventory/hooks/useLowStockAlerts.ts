import { useQuery } from '@tanstack/react-query';
import { fetchLowStockAlerts } from '../api/low-stock';

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: fetchLowStockAlerts,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
