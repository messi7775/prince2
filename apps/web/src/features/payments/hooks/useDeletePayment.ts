import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePayment } from '../api/delete';

interface DeleteParams {
  id: string;
  saleId: string;
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: Omit<DeleteParams, 'saleId'>) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
