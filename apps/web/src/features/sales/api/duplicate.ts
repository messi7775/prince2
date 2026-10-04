import { apiClient } from '../../../lib/api-client';
import type { SaleDetails } from '@prince-net/types';

export async function duplicateSale(id: string): Promise<SaleDetails> {
    return apiClient.post<SaleDetails>(`/sales/${id}/duplicate`, {});
}
