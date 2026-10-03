import { apiClient } from '../../../lib/api-client';
import type { ExpenseCategory } from '@prince-net/types';
import type { UpdateExpenseCategoryInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdateExpenseCategoryInput;
}

export async function updateExpenseCategory({
  id,
  input,
}: UpdateParams): Promise<ExpenseCategory> {
  return apiClient.patch<ExpenseCategory>(`/expense-categories/${id}`, input);
}