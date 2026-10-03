import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activateDistributor } from '../api/activate';
import { deactivateDistributor } from '../api/deactivate';

export function useActivateDistributor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateDistributor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributors', id] });
    },
  });
}

export function useDeactivateDistributor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateDistributor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributors', id] });
    },
  });
}
