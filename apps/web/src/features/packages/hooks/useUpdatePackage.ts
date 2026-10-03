import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdatePackageInput } from '@prince-net/validation';
import { updatePackage } from '../api/update';

interface UpdateParams {
  id: string;
  input: UpdatePackageInput;
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParams) => updatePackage(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages', variables.id] });
    },
  });
}