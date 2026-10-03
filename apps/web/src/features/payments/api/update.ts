import { apiClient } from '../../../lib/api-client';
import type { Payment } from '@prince-net/types';
import type { UpdatePaymentInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdatePaymentInput;
}

export async function updatePayment({
  id,
  input,
}: UpdateParams): Promise<Payment> {
  return apiClient.patch<Payment>(`/payments/${id}`, input);
}
