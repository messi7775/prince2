import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualCashOutInput } from '@prince-net/validation';
import { manualCashOut } from '../api/manualOut';

export function useManualCashOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ManualCashOutInput) => manualCashOut(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}