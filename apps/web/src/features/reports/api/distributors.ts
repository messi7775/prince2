import { apiClient } from '../../../lib/api-client';
import type { DistributorReportRow } from '@prince-net/types';

export interface DistributorsReportResponse {
  rows: DistributorReportRow[];
}

export interface DistributorPerformanceParams {
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'sales' | 'payments' | 'balance' | 'invoices';
  sortDir?: 'asc' | 'desc';
}

export async function fetchDistributorsReport(params: DistributorPerformanceParams = {}): Promise<DistributorsReportResponse> {
  return apiClient.get<DistributorsReportResponse>('/reports/distributors', { query: { ...params } });
}
