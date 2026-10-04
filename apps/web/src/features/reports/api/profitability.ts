import { apiClient } from '../../../lib/api-client';
import type { ProfitabilityReport } from '@prince-net/types';

export interface ProfitabilityParams {
    dateFrom?: string;
    dateTo?: string;
}

export async function getProfitabilityReport(
    params: ProfitabilityParams = {},
): Promise<ProfitabilityReport> {
    return apiClient.get<ProfitabilityReport>('/reports/profitability', {
        query: {
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
        },
    });
}
