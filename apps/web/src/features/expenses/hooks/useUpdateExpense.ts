import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateExpenseInput } from '@prince-net/validation';
import { updateExpense } from '../api/update';

interface UpdateParams {
  id: string;
  input: UpdateExpenseInput;
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParams) => updateExpense(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
