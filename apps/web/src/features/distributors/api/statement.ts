import { apiClient } from '../../../lib/api-client';
import type { DistributorStatement } from '@prince-net/types';

export interface DistributorStatementParams {
    dateFrom?: string;
    dateTo?: string;
    order?: 'asc' | 'desc';
}

export async function getDistributorStatement(
    id: string,
    params: DistributorStatementParams = {},
): Promise<DistributorStatement> {
    return apiClient.get<DistributorStatement>(`/distributors/${id}/statement`, {
        query: {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            order: params.order,
        },
    });
}
