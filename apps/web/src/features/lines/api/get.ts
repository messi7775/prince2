import { apiClient } from '../../../lib/api-client';
import type { Line } from '@prince-net/types';

export async function getLine(id: string): Promise<Line> {
  return apiClient.get<Line>(`/lines/${id}`);
}