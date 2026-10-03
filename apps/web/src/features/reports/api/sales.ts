import { apiClient } from '../../../lib/api-client';
import type {
  SalesReportRow,
  SalesReportSummary,
} from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface SalesReportParams {
  dateFrom?: string;
  dateTo?: string;
  distributorId?: string;
  packageId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
}

export interface SalesReportResponse {
  rows: SalesReportRow[];
  summary: SalesReportSummary;
}

export async function fetchSalesReport(
  params: SalesReportParams,
): Promise<SalesReportResponse> {
  return apiClient.get<SalesReportResponse>('/reports/sales', {
    query: {
      dateFrom: params.dateFrom,
      dateTo: endOfDay(params.dateTo),
      distributorId: params.distributorId,
      packageId: params.packageId,
      status: params.status,
    },
  });
}