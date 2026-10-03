import { apiClient } from '../../../lib/api-client';
import type { LinePayment } from '@prince-net/types';
import type { ReverseLinePaymentInput } from '@prince-net/validation';

interface ReverseLinePaymentParams {
  paymentId: string;
  input: ReverseLinePaymentInput;
}

export async function reverseLinePayment({
  paymentId,
  input,
}: ReverseLinePaymentParams): Promise<LinePayment> {
  return apiClient.post<LinePayment>(
    `/line-payments/${paymentId}/reverse`,
    input,
  );
}