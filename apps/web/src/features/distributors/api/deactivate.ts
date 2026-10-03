import { apiClient } from '../../../lib/api-client';
import type { Distributor } from '@prince-net/types';

export async function deactivateDistributor(id: string): Promise<Distributor> {
  return apiClient.post<Distributor>(`/distributors/${id}/deactivate`);
}
