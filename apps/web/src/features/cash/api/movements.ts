import { apiClient } from '../../../lib/api-client';
import type {
  CashMovement,
  CashSourceType,
  PaginatedResponse,
  PaginationQuery,
} from '@prince-net/types';

interface ListMovementsParams extends PaginationQuery {
  direction?: 'IN' | 'OUT';
  sourceType?: CashSourceType;
  dateFrom?: string;
  dateTo?: string;
}

export async function listCashMovements(
  params: ListMovementsParams,
): Promise<PaginatedResponse<CashMovement>> {
  return apiClient.get<PaginatedResponse<CashMovement>>('/cash/movements', {
    query: {
      page: params.page,
      limit: params.limit,
      order: params.order,
      direction: params.direction,
      sourceType: params.sourceType,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    },
  });
}