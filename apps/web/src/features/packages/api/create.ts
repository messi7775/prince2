import { apiClient } from '../../../lib/api-client';
import type { PackageEntity } from '@prince-net/types';
import type { CreatePackageInput } from '@prince-net/validation';

export async function createPackage(
  input: CreatePackageInput,
): Promise<PackageEntity> {
  return apiClient.post<PackageEntity>('/packages', input);
}