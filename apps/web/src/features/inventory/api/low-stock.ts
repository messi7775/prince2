import { apiClient } from '../../../lib/api-client';
import type { LowStockAlert } from '@prince-net/types';

export async function fetchLowStockAlerts(): Promise<LowStockAlert[]> {
  return apiClient.get<LowStockAlert[]>('/inventory/low-stock');
}
