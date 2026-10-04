import { useQuery } from '@tanstack/react-query';
import { listClosings, type ListClosingsParams } from '../api/closings';

export function useCashClosings(params: ListClosingsParams) {
    return useQuery({
        queryKey: ['cash', 'closings', params],
        queryFn: () => listClosings(params),
        staleTime: 30_000,
    });
}
