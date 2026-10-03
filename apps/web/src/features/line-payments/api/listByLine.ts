import { apiClient } from '../../../lib/api-client';
import type {
  LinePayment,
  PaginatedResponse,
} from '@prince-net/types';

interface ListLinePaymentsParams {
  lineId: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listLinePaymentsByLine(
  params: ListLinePaymentsParams,
): Promise<PaginatedResponse<LinePayment>> {
  return apiClient.get<PaginatedResponse<LinePayment>>(
    `/lines/${params.lineId}/payments`,
    {
      query: {
        page: params.page,
        limit: params.limit,
        order: params.order,
      },
    },
  );
}