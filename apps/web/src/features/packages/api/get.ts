import { apiClient } from '../../../lib/api-client';
import type { PackageEntity } from '@prince-net/types';

export async function getPackage(id: string): Promise<PackageEntity> {
  return apiClient.get<PackageEntity>(`/packages/${id}`);
}