import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReverseOwnerWithdrawalInput } from '@prince-net/validation';
import { reverseOwnerWithdrawal } from '../api/reverse';

interface ReverseParams {
  id: string;
  input: ReverseOwnerWithdrawalInput;
}

export function useReverseOwnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReverseParams) => reverseOwnerWithdrawal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
