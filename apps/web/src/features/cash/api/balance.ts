import { apiClient } from '../../../lib/api-client';
import type { CashBalance } from '@prince-net/types';

export async function getCashBalance(): Promise<CashBalance> {
  return apiClient.get<CashBalance>('/cash/balance');
}