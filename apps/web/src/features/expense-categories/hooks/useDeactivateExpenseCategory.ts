import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateExpenseCategory } from '../api/deactivate';

export function useDeactivateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}