import { apiClient } from '../../../lib/api-client';
import type { Distributor } from '@prince-net/types';
import type { UpdateDistributorInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdateDistributorInput;
}

export async function updateDistributor({
  id,
  input,
}: UpdateParams): Promise<Distributor> {
  return apiClient.patch<Distributor>(`/distributors/${id}`, input);
}