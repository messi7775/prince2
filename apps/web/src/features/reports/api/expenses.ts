import { apiClient } from '../../../lib/api-client';
import type { ExpenseReportRow } from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface ExpensesReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpensesReportResponse {
  rows: ExpenseReportRow[];
}

export async function fetchExpensesReport(
  params: ExpensesReportParams,
): Promise<ExpensesReportResponse> {
  return apiClient.get<ExpensesReportResponse>('/reports/expenses', {
    query: {
      dateFrom: params.dateFrom,
      dateTo: endOfDay(params.dateTo),
    },
  });
}