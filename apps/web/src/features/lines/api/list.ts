import { apiClient } from '../../../lib/api-client';
import type {
  Line,
  PaginatedResponse,
  PaginationQuery,
} from '@prince-net/types';

interface ListParams extends PaginationQuery {
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function listLines(
  params: ListParams,
): Promise<PaginatedResponse<Line>> {
  return apiClient.get<PaginatedResponse<Line>>('/lines', {
    query: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      order: params.order,
      status: params.status,
    },
  });
}