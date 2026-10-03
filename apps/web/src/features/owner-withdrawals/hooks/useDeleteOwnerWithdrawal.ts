import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOwnerWithdrawal } from '../api/delete';

export function useDeleteOwnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOwnerWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
