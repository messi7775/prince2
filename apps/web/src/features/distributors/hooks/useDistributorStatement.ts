import { useQuery } from '@tanstack/react-query';
import {
    getDistributorStatement,
    type DistributorStatementParams,
} from '../api/statement';

export function useDistributorStatement(
    id: string | undefined,
    params: DistributorStatementParams,
) {
    return useQuery({
        queryKey: ['distributors', id, 'statement', params],
        queryFn: () => getDistributorStatement(id as string, params),
        enabled: !!id,
        staleTime: 30_000,
    });
}
