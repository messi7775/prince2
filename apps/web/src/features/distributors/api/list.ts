import { apiClient } from '../../../lib/api-client';
import type {
  Distributor,
  PaginatedResponse,
  PaginationQuery,
} from '@prince-net/types';

interface ListParams extends PaginationQuery {
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function listDistributors(
  params: ListParams,
): Promise<PaginatedResponse<Distributor>> {
  return apiClient.get<PaginatedResponse<Distributor>>('/distributors', {
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      order: params.order,
      status: params.status,
    },
  });
}