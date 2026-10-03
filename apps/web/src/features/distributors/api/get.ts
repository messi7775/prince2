import { apiClient } from '../../../lib/api-client';
import type { Distributor } from '@prince-net/types';

export async function getDistributor(id: string): Promise<Distributor> {
  return apiClient.get<Distributor>(`/distributors/${id}`);
}