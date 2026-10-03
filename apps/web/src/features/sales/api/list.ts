import { apiClient } from '../../../lib/api-client';
import type {
    Sale,
    PaginatedResponse,
    PaginationQuery,
} from '@prince-net/types';

interface ListParams extends PaginationQuery {
    status?: 'ACTIVE' | 'CANCELLED';
    distributorId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export async function listSales(
    params: ListParams,
): Promise<PaginatedResponse<Sale>> {
    return apiClient.get<PaginatedResponse<Sale>>('/sales', {
        query: {
            page: params.page,
            limit: params.limit,
            search: params.search,
            order: params.order,
            status: params.status,
            distributorId: params.distributorId,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
        },
    });
}