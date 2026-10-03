import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSaleInput } from '@prince-net/validation';
import { createSale } from '../api/create';

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateSaleInput) => createSale(input),
        onSuccess: () => {
            // إبطال: قائمة المبيعات + المخزون + الصندوق + ديون الموزعين + Dashboard
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['cash'] });
            queryClient.invalidateQueries({ queryKey: ['distributors'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}