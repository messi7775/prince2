import { apiClient } from '../../../lib/api-client';
import type { Expense } from '@prince-net/types';

export async function getExpense(id: string): Promise<Expense> {
  return apiClient.get<Expense>(`/expenses/${id}`);
}
