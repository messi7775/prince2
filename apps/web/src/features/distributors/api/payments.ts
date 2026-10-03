import { apiClient } from '../../../lib/api-client';
import type { Payment, PaginatedResponse } from '@prince-net/types';

interface ListPaymentsParams {
  id: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listDistributorPayments(
  params: ListPaymentsParams,
): Promise<PaginatedResponse<Payment>> {
  return apiClient.get<PaginatedResponse<Payment>>(
    `/distributors/${params.id}/payments`,
    {
      query: {
        page: params.page,
        limit: params.limit,
        order: params.order,
      },
    },
  );
}