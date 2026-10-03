import { apiClient } from '../../../lib/api-client';
import type { PackageStockSummary } from '@prince-net/types';
import type { AddInventoryInput } from '@prince-net/validation';

export async function addInventory(
  input: AddInventoryInput,
): Promise<PackageStockSummary> {
  return apiClient.post<PackageStockSummary>('/inventory/add', input);
}