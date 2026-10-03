import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReversePaymentInput } from '@prince-net/validation';
import { reversePayment } from '../api/reverse';

interface ReversePaymentParams {
  paymentId: string;
  saleId: string;
  input: ReversePaymentInput;
}

export function useReversePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: ReversePaymentParams) =>
      reversePayment({ paymentId, input }),
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