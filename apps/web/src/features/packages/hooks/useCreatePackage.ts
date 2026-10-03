import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreatePackageInput } from '@prince-net/validation';
import { createPackage } from '../api/create';

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePackageInput) => createPackage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}