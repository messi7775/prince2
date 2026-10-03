import { apiClient } from '../../../lib/api-client';
import type { ExpenseCategory } from '@prince-net/types';
import type { CreateExpenseCategoryInput } from '@prince-net/validation';

export async function createExpenseCategory(
  input: CreateExpenseCategoryInput,
): Promise<ExpenseCategory> {
  return apiClient.post<ExpenseCategory>('/expense-categories', input);
}