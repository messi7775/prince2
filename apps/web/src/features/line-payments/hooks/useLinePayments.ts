import { useQuery } from '@tanstack/react-query';
import { listLinePaymentsByLine } from '../api/listByLine';

interface UseLinePaymentsParams {
  lineId: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
}

export function useLinePayments({
  lineId,
  page,
  limit,
  order = 'desc',
}: UseLinePaymentsParams) {
  return useQuery({
    queryKey: ['lines', lineId, 'payments', { page, limit, order }],
    queryFn: () =>
      listLinePaymentsByLine({ lineId: lineId!, page, limit, order }),
    enabled: !!lineId,
    staleTime: 30_000,
  });
}