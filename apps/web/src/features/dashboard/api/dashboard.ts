import { apiClient } from '../../../lib/api-client';
import type { DashboardData } from '@prince-net/types';

export async function fetchDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>('/dashboard');
}