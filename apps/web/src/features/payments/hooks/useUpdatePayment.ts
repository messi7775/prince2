import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdatePaymentInput } from '@prince-net/validation';
import { updatePayment } from '../api/update';

interface UpdateParams {
  id: string;
  saleId: string;
  input: UpdatePaymentInput;
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: Omit<UpdateParams, 'saleId'>) =>
      updatePayment({ id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
