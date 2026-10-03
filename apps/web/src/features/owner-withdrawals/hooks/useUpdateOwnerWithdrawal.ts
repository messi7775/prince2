import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateOwnerWithdrawalInput } from '@prince-net/validation';
import { updateOwnerWithdrawal } from '../api/update';

interface UpdateParams {
  id: string;
  input: UpdateOwnerWithdrawalInput;
}

export function useUpdateOwnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParams) => updateOwnerWithdrawal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
