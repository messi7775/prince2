import { apiClient } from '../../../lib/api-client';
import type { InventoryByPackage } from '@prince-net/types';

export async function getPackageInventory(
  packageId: string,
): Promise<InventoryByPackage> {
  return apiClient.get<InventoryByPackage>(`/inventory/${packageId}`);
}