import { apiClient } from '../../../lib/api-client';
import type { Expense } from '@prince-net/types';
import type { CreateExpenseInput } from '@prince-net/validation';

export async function createExpense(
  input: CreateExpenseInput,
): Promise<Expense> {
  return apiClient.post<Expense>('/expenses', input);
}
