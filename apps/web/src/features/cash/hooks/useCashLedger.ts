import { useQuery } from '@tanstack/react-query';
import { getCashLedger, type CashLedgerParams } from '../api/ledger';

export function useCashLedger(params: CashLedgerParams) {
    return useQuery({
        queryKey: ['cash', 'ledger', params],
        queryFn: () => getCashLedger(params),
        staleTime: 30_000,
    });
}
