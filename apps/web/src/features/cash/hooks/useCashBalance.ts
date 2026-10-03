import { useQuery } from '@tanstack/react-query';
import { getCashBalance } from '../api/balance';

export function useCashBalance() {
  return useQuery({
    queryKey: ['cash', 'balance'],
    queryFn: getCashBalance,
    staleTime: 30_000,
  });
}