import { apiClient } from '../../../lib/api-client';

export async function restoreBackup(id: string): Promise<void> {
    await apiClient.post(`/backups/${id}/restore`);
}
