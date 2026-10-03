import { apiClient } from '../../../lib/api-client';
import type { Line } from '@prince-net/types';

export async function deactivateLine(id: string): Promise<Line> {
  return apiClient.post<Line>(`/lines/${id}/deactivate`);
}
