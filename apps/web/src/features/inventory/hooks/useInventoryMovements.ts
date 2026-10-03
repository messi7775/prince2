import { useQuery } from '@tanstack/react-query';
import { listInventoryMovements } from '../api/movements';

interface UseInventoryMovementsParams {
  packageId: string | undefined;
  page: number;
  limit: number;
  order?: 'asc' | 'desc';
}

export function useInventoryMovements({
  packageId,
  page,
  limit,
  order = 'desc',
}: UseInventoryMovementsParams) {
  return useQuery({
    queryKey: ['inventory', 'package', packageId, 'movements', { page, limit, order }],
    queryFn: () =>
      listInventoryMovements({
        packageId: packageId!,
        page,
        limit,
        order,
      }),
    enabled: !!packageId,
    staleTime: 30_000,
  });
}