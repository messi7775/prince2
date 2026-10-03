import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateDistributorInput } from '@prince-net/validation';
import { updateDistributor } from '../api/update';

interface UpdateParams {
  id: string;
  input: UpdateDistributorInput;
}

export function useUpdateDistributor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParams) => updateDistributor(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({
        queryKey: ['distributors', variables.id],
      });
    },
  });
}