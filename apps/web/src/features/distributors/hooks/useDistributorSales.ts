import { useQuery } from '@tanstack/react-query';
import { listDistributorSales } from '../api/sales';

interface UseDistributorSalesParams {
  id: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
}

export function useDistributorSales({
  id,
  page,
  limit,
  order = 'desc',
}: UseDistributorSalesParams) {
  return useQuery({
    queryKey: ['distributors', id, 'sales', { page, limit, order }],
    queryFn: () => listDistributorSales({ id: id!, page, limit, order }),
    enabled: !!id,
    staleTime: 30_000,
  });
}