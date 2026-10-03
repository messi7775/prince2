import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activatePackage } from '../api/activate';
import { deactivatePackage } from '../api/deactivate';

export function useActivatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activatePackage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages', id] });
    },
  });
}

export function useDeactivatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivatePackage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages', id] });
    },
  });
}