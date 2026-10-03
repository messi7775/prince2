import { useQuery } from '@tanstack/react-query';
import { listPaymentsBySale } from '../api/listBySale';

interface UsePaymentsParams {
  saleId: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
}

export function usePayments({
  saleId,
  page,
  limit,
  order = 'desc',
}: UsePaymentsParams) {
  return useQuery({
    queryKey: ['sales', saleId, 'payments', { page, limit, order }],
    queryFn: () =>
      listPaymentsBySale({ saleId: saleId!, page, limit, order }),
    enabled: !!saleId,
    staleTime: 30_000,
  });
}