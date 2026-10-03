import { useQuery } from '@tanstack/react-query';
import { getDistributorBalance } from '../api/balance';

export function useDistributorBalance(id: string | undefined) {
  return useQuery({
    queryKey: ['distributors', id, 'balance'],
    queryFn: () => getDistributorBalance(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}