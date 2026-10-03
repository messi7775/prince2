import { apiClient } from '../../../lib/api-client';
import type { SaleDetails } from '@prince-net/types';

export async function getSale(id: string): Promise<SaleDetails> {
    return apiClient.get<SaleDetails>(`/sales/${id}`);
}