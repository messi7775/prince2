import { apiClient } from '../../../lib/api-client';
import type { PackageEntity } from '@prince-net/types';

export async function activatePackage(id: string): Promise<PackageEntity> {
  return apiClient.post<PackageEntity>(`/packages/${id}/activate`);
}