import { apiClient } from '../../../lib/api-client';
import type { Line } from '@prince-net/types';

export async function activateLine(id: string): Promise<Line> {
  return apiClient.post<Line>(`/lines/${id}/activate`);
}
