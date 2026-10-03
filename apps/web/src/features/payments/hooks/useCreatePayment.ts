import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreatePaymentInput } from '@prince-net/validation';
import { createPayment } from '../api/create';

interface CreatePaymentParams {
  saleId: string;
  input: CreatePaymentInput;
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreatePaymentParams) => createPayment(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sales', variables.saleId],
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}