import { apiClient } from '../../../lib/api-client';
import type {
  CollectionsReportRow,
  CollectionsReportSummary,
} from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface CollectionsReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface CollectionsReportResponse {
  rows: CollectionsReportRow[];
  summary: CollectionsReportSummary;
}

export async function fetchCollectionsReport(
  params: CollectionsReportParams,
): Promise<CollectionsReportResponse> {
  return apiClient.get<CollectionsReportResponse>('/reports/collections', {
    query: {
      dateFrom: params.dateFrom,
      dateTo: endOfDay(params.dateTo),
    },
  });
}
