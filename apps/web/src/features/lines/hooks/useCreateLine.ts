import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLineInput } from '@prince-net/validation';
import { createLine } from '../api/create';

export function useCreateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLineInput) => createLine(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    },
  });
}