import { apiClient } from '../../../lib/api-client';
import type { LineReportRow } from '@prince-net/types';

export interface LinesReportResponse {
  rows: LineReportRow[];
}

export async function fetchLinesReport(): Promise<LinesReportResponse> {
  return apiClient.get<LinesReportResponse>('/reports/lines');
}
