import { apiClient } from '../../../lib/api-client';
import type { InventoryRow } from '@prince-net/types';

export async function listInventoryOverview(): Promise<InventoryRow[]> {
  return apiClient.get<InventoryRow[]>('/inventory');
}