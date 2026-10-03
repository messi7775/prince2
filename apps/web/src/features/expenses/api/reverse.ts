import { apiClient } from '../../../lib/api-client';
import type { Expense } from '@prince-net/types';
import type { ReverseExpenseInput } from '@prince-net/validation';

interface ReverseParams {
  id: string;
  input: ReverseExpenseInput;
}

export async function reverseExpense({
  id,
  input,
}: ReverseParams): Promise<Expense> {
  return apiClient.post<Expense>(`/expenses/${id}/reverse`, input);
}
