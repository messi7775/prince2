import { apiClient } from '../../../lib/api-client';

export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/expenses/${id}`);
}
