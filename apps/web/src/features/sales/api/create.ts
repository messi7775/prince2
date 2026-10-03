import { apiClient } from '../../../lib/api-client';
import type { SaleDetails } from '@prince-net/types';
import type { CreateSaleInput } from '@prince-net/validation';

export async function createSale(
    input: CreateSaleInput,
): Promise<SaleDetails> {
    return apiClient.post<SaleDetails>('/sales', input);
}