import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdjustInventoryInput } from '@prince-net/validation';
import { adjustInventory } from '../api/adjust';

export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustInventoryInput) => adjustInventory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}