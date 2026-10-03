import { useQuery } from '@tanstack/react-query';
import { getPackageInventory } from '../api/get';

export function usePackageInventory(packageId: string | undefined) {
  return useQuery({
    queryKey: ['inventory', 'package', packageId],
    queryFn: () => getPackageInventory(packageId!),
    enabled: !!packageId,
    staleTime: 30_000,
  });
}