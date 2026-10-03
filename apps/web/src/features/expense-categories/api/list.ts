import { apiClient } from '../../../lib/api-client';
import type { ExpenseCategory } from '@prince-net/types';

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  return apiClient.get<ExpenseCategory[]>('/expense-categories');
}