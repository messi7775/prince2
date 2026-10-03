import { apiClient } from '../../../lib/api-client';
import type { Distributor } from '@prince-net/types';
import type { CreateDistributorInput } from '@prince-net/validation';

export async function createDistributor(
  input: CreateDistributorInput,
): Promise<Distributor> {
  return apiClient.post<Distributor>('/distributors', input);
}