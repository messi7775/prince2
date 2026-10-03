import { apiClient } from '../../../lib/api-client';

export async function deleteLine(id: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/lines/${id}`);
}
