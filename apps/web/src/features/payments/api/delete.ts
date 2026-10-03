import { apiClient } from '../../../lib/api-client';

export async function deletePayment(id: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/payments/${id}`);
}
