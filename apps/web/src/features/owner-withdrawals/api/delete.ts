import { apiClient } from '../../../lib/api-client';

export async function deleteOwnerWithdrawal(id: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/owner-withdrawals/${id}`);
}
