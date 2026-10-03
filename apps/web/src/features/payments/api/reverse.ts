import { apiClient } from '../../../lib/api-client';
import type { Payment } from '@prince-net/types';
import type { ReversePaymentInput } from '@prince-net/validation';

interface ReversePaymentParams {
  paymentId: string;
  input: ReversePaymentInput;
}

export async function reversePayment({
  paymentId,
  input,
}: ReversePaymentParams): Promise<Payment> {
  return apiClient.post<Payment>(`/payments/${paymentId}/reverse`, input);
}