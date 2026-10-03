import { apiClient } from '../../../lib/api-client';
import type { LinePayment } from '@prince-net/types';
import type { CreateLinePaymentInput } from '@prince-net/validation';

interface CreateLinePaymentParams {
  lineId: string;
  input: CreateLinePaymentInput;
}

export async function createLinePayment({
  lineId,
  input,
}: CreateLinePaymentParams): Promise<LinePayment> {
  return apiClient.post<LinePayment>(`/lines/${lineId}/payments`, input);
}