import { apiClient } from '../../../lib/api-client';
import type { InventoryMovement } from '@prince-net/types';
import type { AdjustInventoryInput } from '@prince-net/validation';

export async function adjustInventory(
  input: AdjustInventoryInput,
): Promise<InventoryMovement> {
  return apiClient.post<InventoryMovement>('/inventory/adjust', input);
}