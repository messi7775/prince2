import { useQuery } from '@tanstack/react-query';
import { getSale } from '../api/get';

export function useSale(id: string | undefined) {
    return useQuery({
        queryKey: ['sales', id],
        queryFn: () => getSale(id!),
        enabled: !!id,
        staleTime: 30_000,
    });
}