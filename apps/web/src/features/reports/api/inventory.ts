import { apiClient } from '../../../lib/api-client';
import type { InventoryReportRow } from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface InventoryReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryReportResponse {
  rows: InventoryReportRow[];
}

export async function fetchInventoryReport(
  params: InventoryReportParams,
): Promise<InventoryReportResponse> {
  return apiClient.get<InventoryReportResponse>('/reports/inventory', {
    query: {
      dateFrom: params.dateFrom,
      dateTo: endOfDay(params.dateTo),
    },
  });
}