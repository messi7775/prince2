import { apiClient } from '../../../lib/api-client';
import type { Sale, PaginatedResponse } from '@prince-net/types';

interface ListSalesParams {
  id: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listDistributorSales(
  params: ListSalesParams,
): Promise<PaginatedResponse<Sale>> {
  return apiClient.get<PaginatedResponse<Sale>>(
    `/distributors/${params.id}/sales`,
    {
      query: {
        page: params.page,
        limit: params.limit,
        order: params.order,
      },
    },
  );
}