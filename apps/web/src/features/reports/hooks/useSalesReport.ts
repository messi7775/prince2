import { useQuery } from '@tanstack/react-query';
import { fetchSalesReport } from '../api/sales';

interface UseSalesReportParams {
  dateFrom?: string;
  dateTo?: string;
  distributorId?: string;
  packageId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
}

export function useSalesReport(params: UseSalesReportParams) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => fetchSalesReport(params),
    staleTime: 60_000,
  });
}
