import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateSale } from '../api/duplicate';

export function useDuplicateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => duplicateSale(id),
        onSuccess: (newSale) => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['cash'] });
            queryClient.invalidateQueries({ queryKey: ['distributors'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            return newSale;
        },
    });
}
