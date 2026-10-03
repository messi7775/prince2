import { apiClient } from '../../../lib/api-client';
import type { Line } from '@prince-net/types';
import type { UpdateLineInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdateLineInput;
}

export async function updateLine({
  id,
  input,
}: UpdateParams): Promise<Line> {
  return apiClient.patch<Line>(`/lines/${id}`, input);
}