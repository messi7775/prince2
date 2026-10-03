import { apiClient } from '../../../lib/api-client';
import type {
  InventoryMovement,
  PaginatedResponse,
} from '@prince-net/types';

interface ListMovementsParams {
  packageId: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listInventoryMovements(
  params: ListMovementsParams,
): Promise<PaginatedResponse<InventoryMovement>> {
  return apiClient.get<PaginatedResponse<InventoryMovement>>(
    `/inventory/${params.packageId}/movements`,
    {
      query: {
        page: params.page,
        limit: params.limit,
        order: params.order,
      },
    },
  );
}