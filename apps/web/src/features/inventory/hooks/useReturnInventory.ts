import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReturnInventoryInput } from '@prince-net/validation';
import { returnInventory } from '../api/return';

export function useReturnInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReturnInventoryInput) => returnInventory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}