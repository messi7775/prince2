import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activateLine } from '../api/activate';
import { deactivateLine } from '../api/deactivate';

export function useActivateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateLine(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      queryClient.invalidateQueries({ queryKey: ['lines', id] });
    },
  });
}

export function useDeactivateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateLine(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      queryClient.invalidateQueries({ queryKey: ['lines', id] });
    },
  });
}
