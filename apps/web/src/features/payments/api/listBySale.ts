import { apiClient } from '../../../lib/api-client';
import type {
  Payment,
  PaginatedResponse,
} from '@prince-net/types';

interface ListPaymentsParams {
  saleId: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listPaymentsBySale(
  params: ListPaymentsParams,
): Promise<PaginatedResponse<Payment>> {
  return apiClient.get<PaginatedResponse<Payment>>(
    `/sales/${params.saleId}/payments`,
    {
      query: {
        page: params.page,
        limit: params.limit,
        order: params.order,
      },
    },
  );
}