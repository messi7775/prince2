import { apiClient } from '../../../lib/api-client';
import type {
  CashReportRow,
  CashReportSummary,
} from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface CashReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface CashReportResponse {
  rows: CashReportRow[];
  summary: CashReportSummary;
}

export async function fetchCashReport(
  params: CashReportParams,
): Promise<CashReportResponse> {
  return apiClient.get<CashReportResponse>('/reports/cash', {
    query: {
      dateFrom: params.dateFrom,
      dateTo: endOfDay(params.dateTo),
    },
  });
}