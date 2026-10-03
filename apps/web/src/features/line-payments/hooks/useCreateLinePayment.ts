import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLinePaymentInput } from '@prince-net/validation';
import { createLinePayment } from '../api/create';

interface CreateLinePaymentParams {
  lineId: string;
  input: CreateLinePaymentInput;
}

export function useCreateLinePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateLinePaymentParams) =>
      createLinePayment(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lines', variables.lineId, 'payments'],
      });
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}