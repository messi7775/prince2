import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateOwnerWithdrawalInput } from '@prince-net/validation';
import { createOwnerWithdrawal } from '../api/create';

export function useCreateOwnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOwnerWithdrawalInput) =>
      createOwnerWithdrawal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
