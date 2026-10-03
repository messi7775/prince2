import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualCashInInput } from '@prince-net/validation';
import { manualCashIn } from '../api/manualIn';

export function useManualCashIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ManualCashInInput) => manualCashIn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}