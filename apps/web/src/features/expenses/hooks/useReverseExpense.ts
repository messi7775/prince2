import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReverseExpenseInput } from '@prince-net/validation';
import { reverseExpense } from '../api/reverse';

interface ReverseParams {
  id: string;
  input: ReverseExpenseInput;
}

export function useReverseExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReverseParams) => reverseExpense(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
