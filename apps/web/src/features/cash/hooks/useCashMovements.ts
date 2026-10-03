import { useQuery } from '@tanstack/react-query';
import type { CashSourceType } from '@prince-net/types';
import { listCashMovements } from '../api/movements';

interface UseCashMovementsParams {
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
  direction?: 'IN' | 'OUT';
  sourceType?: CashSourceType;
  dateFrom?: string;
  dateTo?: string;
}

export function useCashMovements(params: UseCashMovementsParams) {
  return useQuery({
    queryKey: ['cash', 'movements', params],
    queryFn: () => listCashMovements(params),
    staleTime: 30_000,
  });
}