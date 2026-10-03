import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activateExpenseCategory } from '../api/activate';

export function useActivateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}