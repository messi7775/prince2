import { apiClient } from '../../../lib/api-client';
import type { ExpenseCategory } from '@prince-net/types';

export async function deactivateExpenseCategory(
  id: string,
): Promise<ExpenseCategory> {
  return apiClient.post<ExpenseCategory>(
    `/expense-categories/${id}/deactivate`,
  );
}