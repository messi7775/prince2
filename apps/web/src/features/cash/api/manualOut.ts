import { apiClient } from '../../../lib/api-client';
import type { CashMovement } from '@prince-net/types';
import type { ManualCashOutInput } from '@prince-net/validation';

export async function manualCashOut(
  input: ManualCashOutInput,
): Promise<CashMovement> {
  return apiClient.post<CashMovement>('/cash/manual-out', input);
}