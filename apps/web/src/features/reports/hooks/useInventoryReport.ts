import { useQuery } from '@tanstack/react-query';
import { fetchInventoryReport } from '../api/inventory';

interface UseInventoryReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export function useInventoryReport(params: UseInventoryReportParams) {
  return useQuery({
    queryKey: ['reports', 'inventory', params],
    queryFn: () => fetchInventoryReport(params),
    staleTime: 60_000,
  });
}
