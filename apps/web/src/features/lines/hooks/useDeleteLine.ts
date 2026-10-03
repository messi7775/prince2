import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLine } from '../api/delete';

export function useDeleteLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    },
  });
}
