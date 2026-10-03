import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReverseLinePaymentInput } from '@prince-net/validation';
import { reverseLinePayment } from '../api/reverse';

interface ReverseLinePaymentParams {
  paymentId: string;
  lineId: string;
  input: ReverseLinePaymentInput;
}

export function useReverseLinePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: ReverseLinePaymentParams) =>
      reverseLinePayment({ paymentId, input }),
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