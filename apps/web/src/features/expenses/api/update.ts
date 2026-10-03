import { apiClient } from '../../../lib/api-client';
import type { Expense } from '@prince-net/types';
import type { UpdateExpenseInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdateExpenseInput;
}

export async function updateExpense({
  id,
  input,
}: UpdateParams): Promise<Expense> {
  return apiClient.patch<Expense>(`/expenses/${id}`, input);
}
