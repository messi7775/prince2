import { apiClient } from '../../../lib/api-client';
import type { InventoryMovement } from '@prince-net/types';
import type { ReturnInventoryInput } from '@prince-net/validation';

export async function returnInventory(
  input: ReturnInventoryInput,
): Promise<InventoryMovement> {
  return apiClient.post<InventoryMovement>('/inventory/return', input);
}