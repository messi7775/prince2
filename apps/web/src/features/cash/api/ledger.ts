import { apiClient } from '../../../lib/api-client';
import type { CashLedger, CashSourceType } from '@prince-net/types';

export interface CashLedgerParams {
    dateFrom?: string;
    dateTo?: string;
    sourceType?: CashSourceType;
    direction?: 'IN' | 'OUT';
    search?: string;
    order?: 'asc' | 'desc';
}

export async function getCashLedger(
    params: CashLedgerParams = {},
): Promise<CashLedger> {
    return apiClient.get<CashLedger>('/cash/ledger', {
        query: {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            sourceType: params.sourceType,
            direction: params.direction,
            search: params.search,
            order: params.order,
        },
    });
}
