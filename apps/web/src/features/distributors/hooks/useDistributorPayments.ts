import { useQuery } from '@tanstack/react-query';
import { listDistributorPayments } from '../api/payments';

interface UseDistributorPaymentsParams {
  id: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
}

export function useDistributorPayments({
  id,
  page,
  limit,
  order = 'desc',
}: UseDistributorPaymentsParams) {
  return useQuery({
    queryKey: ['distributors', id, 'payments', { page, limit, order }],
    queryFn: () => listDistributorPayments({ id: id!, page, limit, order }),
    enabled: !!id,
    staleTime: 30_000,
  });
}