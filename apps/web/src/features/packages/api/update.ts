import { apiClient } from '../../../lib/api-client';
import type { PackageEntity } from '@prince-net/types';
import type { UpdatePackageInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdatePackageInput;
}

export async function updatePackage({
  id,
  input,
}: UpdateParams): Promise<PackageEntity> {
  return apiClient.patch<PackageEntity>(`/packages/${id}`, input);
}