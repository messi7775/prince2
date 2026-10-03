import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateLineInput } from '@prince-net/validation';
import { updateLine } from '../api/update';

interface UpdateParams {
  id: string;
  input: UpdateLineInput;
}

export function useUpdateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParams) => updateLine(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      queryClient.invalidateQueries({ queryKey: ['lines', variables.id] });
    },
  });
}