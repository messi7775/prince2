import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CancelSaleInput } from '@prince-net/validation';
import { cancelSale } from '../api/cancel';

interface CancelParams {
    id: string;
    input: CancelSaleInput;
}

export function useCancelSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CancelParams) => cancelSale(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['cash'] });
            queryClient.invalidateQueries({ queryKey: ['distributors'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}