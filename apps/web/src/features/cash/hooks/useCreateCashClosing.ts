import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCashClosingInput } from '@prince-net/validation';
import { createClosing } from '../api/closings';

export function useCreateCashClosing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateCashClosingInput) => createClosing(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cash'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
