import { apiClient } from '../../../lib/api-client';
import type { Payment } from '@prince-net/types';
import type { CreatePaymentInput } from '@prince-net/validation';

interface CreatePaymentParams {
  saleId: string;
  input: CreatePaymentInput;
}

export async function createPayment({
  saleId,
  input,
}: CreatePaymentParams): Promise<Payment> {
  return apiClient.post<Payment>(`/sales/${saleId}/payments`, input);
}