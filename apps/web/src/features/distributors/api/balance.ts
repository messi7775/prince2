import { apiClient } from '../../../lib/api-client';
import type { DistributorBalance } from '@prince-net/types';

export async function getDistributorBalance(
  id: string,
): Promise<DistributorBalance> {
  return apiClient.get<DistributorBalance>(`/distributors/${id}/balance`);
}