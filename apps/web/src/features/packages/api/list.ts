import { apiClient } from '../../../lib/api-client';
import type {
  PackageEntity,
  PaginatedResponse,
  PaginationQuery,
} from '@prince-net/types';

interface ListParams extends PaginationQuery {
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function listPackages(
  params: ListParams,
): Promise<PaginatedResponse<PackageEntity>> {
  const query: Record<string, string | number | undefined> = {
    page: params.page,
    limit: params.limit,
    search: params.search,
    order: params.order,
    status: params.status,
  };

  return apiClient.get<PaginatedResponse<PackageEntity>>('/packages', {
    query,
  });
}