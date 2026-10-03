import { useQuery } from '@tanstack/react-query';
import type { PaginationQuery } from '@prince-net/types';
import { listSales } from '../api/list';

interface UseSalesParams extends PaginationQuery {
    status?: 'ACTIVE' | 'CANCELLED';
    distributorId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export function useSales(params: UseSalesParams) {
    return useQuery({
        queryKey: ['sales', params],
        queryFn: () => listSales(params),
        staleTime: 30_000,
    });
}