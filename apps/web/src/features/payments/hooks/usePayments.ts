import { useQuery } from '@tanstack/react-query';
import { listPaymentsBySale } from '../api/listBySale';

interface UsePaymentsParams {
  saleId: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
  status?: 'ACTIVE' | 'REVERSED';
}

export function usePayments({
  saleId,
  page,
  limit,
  order = 'desc',
  status,
}: UsePaymentsParams) {
  return useQuery({
    queryKey: ['sales', saleId, 'payments', { page, limit, order, status }],
    queryFn: () =>
      listPaymentsBySale({ saleId: saleId!, page, limit, order, status }),
    enabled: !!saleId,
    staleTime: 30_000,
  });
}
