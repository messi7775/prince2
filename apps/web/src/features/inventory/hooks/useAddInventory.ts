import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddInventoryInput } from '@prince-net/validation';
import { addInventory } from '../api/add';

export function useAddInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddInventoryInput) => addInventory(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({
        queryKey: ['inventory', 'package', variables.packageId],
      });
    },
  });
}