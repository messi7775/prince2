import { useQuery } from '@tanstack/react-query';
import { listLinePaymentsByLine } from '../api/listByLine';

interface UseLinePaymentsParams {
  lineId: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
  status?: 'ACTIVE' | 'REVERSED';
}

export function useLinePayments({
  lineId,
  page,
  limit,
  order = 'desc',
  status,
}: UseLinePaymentsParams) {
  return useQuery({
    queryKey: ['lines', lineId, 'payments', { page, limit, order, status }],
    queryFn: () =>
      listLinePaymentsByLine({ lineId: lineId!, page, limit, order, status }),
    enabled: !!lineId,
    staleTime: 30_000,
  });
}
