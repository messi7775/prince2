import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDistributorInput } from '@prince-net/validation';
import { createDistributor } from '../api/create';

export function useCreateDistributor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDistributorInput) => createDistributor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
    },
  });
}