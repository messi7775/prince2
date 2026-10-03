import { apiClient } from '../../../lib/api-client';
import type {
  Expense,
  PaginatedResponse,
  PaginationQuery,
} from '@prince-net/types';

interface ListParams extends PaginationQuery {
  categoryId?: string;
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

export async function listExpenses(
  params: ListParams,
): Promise<PaginatedResponse<Expense>> {
  return apiClient.get<PaginatedResponse<Expense>>('/expenses', {
    query: {
      page: params.page,
      limit: params.limit,
      order: params.order,
      categoryId: params.categoryId,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    },
  });
}
