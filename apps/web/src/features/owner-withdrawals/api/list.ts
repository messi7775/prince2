import { apiClient } from '../../../lib/api-client';
import type {
  OwnerWithdrawal,
  PaginatedResponse,
  PaginationQuery,
} from '@prince-net/types';

interface ListParams extends PaginationQuery {
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

export async function listOwnerWithdrawals(
  params: ListParams,
): Promise<PaginatedResponse<OwnerWithdrawal>> {
  return apiClient.get<PaginatedResponse<OwnerWithdrawal>>(
    '/owner-withdrawals',
    {
      query: {
        page: params.page,
        limit: params.limit,
        order: params.order,
        status: params.status,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    },
  );
}
