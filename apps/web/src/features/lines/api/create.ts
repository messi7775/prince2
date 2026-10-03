import { apiClient } from '../../../lib/api-client';
import type { Line } from '@prince-net/types';
import type { CreateLineInput } from '@prince-net/validation';

export async function createLine(
  input: CreateLineInput,
): Promise<Line> {
  return apiClient.post<Line>('/lines', input);
}