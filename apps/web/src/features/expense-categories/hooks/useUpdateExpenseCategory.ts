import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateExpenseCategoryInput } from '@prince-net/validation';
import { updateExpenseCategory } from '../api/update';

interface UpdateParams {
  id: string;
  input: UpdateExpenseCategoryInput;
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParams) => updateExpenseCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}