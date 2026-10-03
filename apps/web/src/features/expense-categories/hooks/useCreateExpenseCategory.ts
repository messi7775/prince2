import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateExpenseCategoryInput } from '@prince-net/validation';
import { createExpenseCategory } from '../api/create';

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseCategoryInput) =>
      createExpenseCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}