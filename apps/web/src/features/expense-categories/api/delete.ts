import { apiClient } from '../../../lib/api-client';

export async function deleteExpenseCategory(id: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/expense-categories/${id}`);
}
