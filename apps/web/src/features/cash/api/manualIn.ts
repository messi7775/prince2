import { apiClient } from '../../../lib/api-client';
import type { CashMovement } from '@prince-net/types';
import type { ManualCashInInput } from '@prince-net/validation';

export async function manualCashIn(
  input: ManualCashInInput,
): Promise<CashMovement> {
  return apiClient.post<CashMovement>('/cash/manual-in', input);
}