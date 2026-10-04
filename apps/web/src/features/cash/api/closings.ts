import { apiClient } from '../../../lib/api-client';
import type {
    CashClosing,
    CashClosingPreview,
    PaginatedResponse,
} from '@prince-net/types';
import type { CreateCashClosingInput } from '@prince-net/validation';

export interface ListClosingsParams {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
}

export async function listClosings(
    params: ListClosingsParams = {},
): Promise<PaginatedResponse<CashClosing>> {
    return apiClient.get<PaginatedResponse<CashClosing>>('/cash/closings', {
        query: {
            page: params.page,
            limit: params.limit,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
        },
    });
}

export async function previewClosing(
    date: string,
): Promise<CashClosingPreview> {
    return apiClient.get<CashClosingPreview>('/cash/closings/preview', {
        query: { date },
    });
}

export async function createClosing(
    input: CreateCashClosingInput,
): Promise<CashClosing> {
    return apiClient.post<CashClosing>('/cash/closings', input);
}
