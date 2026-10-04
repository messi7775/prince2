import { useQuery } from '@tanstack/react-query';
import {
    getProfitabilityReport,
    type ProfitabilityParams,
} from '../api/profitability';

export function useProfitabilityReport(params: ProfitabilityParams) {
    return useQuery({
        queryKey: ['reports', 'profitability', params],
        queryFn: () => getProfitabilityReport(params),
        staleTime: 60_000,
    });
}
