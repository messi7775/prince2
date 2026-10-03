import { apiClient } from '../../../lib/api-client';
import type {
  OwnerWithdrawalsReportRow,
  OwnerWithdrawalsReportSummary,
} from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface OwnerWithdrawalsReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface OwnerWithdrawalsReportResponse {
  rows: OwnerWithdrawalsReportRow[];
  summary: OwnerWithdrawalsReportSummary;
}

export async function fetchOwnerWithdrawalsReport(
  params: OwnerWithdrawalsReportParams,
): Promise<OwnerWithdrawalsReportResponse> {
  return apiClient.get<OwnerWithdrawalsReportResponse>(
    '/reports/owner-withdrawals',
    {
      query: {
        dateFrom: params.dateFrom,
        dateTo: endOfDay(params.dateTo),
      },
    },
  );
}
