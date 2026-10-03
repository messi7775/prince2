import { apiClient } from '../../../lib/api-client';
import type { DistributorReportRow } from '@prince-net/types';

export interface DistributorsReportResponse {
  rows: DistributorReportRow[];
}

export async function fetchDistributorsReport(): Promise<DistributorsReportResponse> {
  return apiClient.get<DistributorsReportResponse>('/reports/distributors');
}
