import { useQuery } from '@tanstack/react-query';
import { listInventoryOverview } from '../api/list';

export function useInventoryOverview() {
  return useQuery({
    queryKey: ['inventory', 'overview'],
    queryFn: listInventoryOverview,
    staleTime: 30_000,
  });
}