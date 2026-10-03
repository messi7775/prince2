import { apiClient } from '../../../lib/api-client';
import type { SaleDetails } from '@prince-net/types';
import type { CancelSaleInput } from '@prince-net/validation';

interface CancelParams {
    id: string;
    input: CancelSaleInput;
}

export async function cancelSale({
    id,
    input,
}: CancelParams): Promise<SaleDetails> {
    return apiClient.post<SaleDetails>(`/sales/${id}/cancel`, input);
}