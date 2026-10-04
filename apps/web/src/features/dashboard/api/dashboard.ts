import { apiClient } from '../../../lib/api-client';
import type { DashboardData, DashboardPeriod } from '@prince-net/types';

export async function fetchDashboard(
  period: DashboardPeriod = 'today',
): Promise<DashboardData> {
  return apiClient.get<DashboardData>('/dashboard', {
    query: { period },
  });
}
