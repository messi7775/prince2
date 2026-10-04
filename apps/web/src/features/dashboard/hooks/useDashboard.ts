import { useQuery } from '@tanstack/react-query';
import type { DashboardPeriod } from '@prince-net/types';
import { fetchDashboard } from '../api/dashboard';

export function useDashboard(period: DashboardPeriod = 'today') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => fetchDashboard(period),
    staleTime: 30_000,
  });
}
