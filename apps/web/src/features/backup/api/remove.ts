import { apiClient } from '../../../lib/api-client';

export async function removeBackup(id: string): Promise<void> {
    await apiClient.delete(`/backups/${id}`);
}

export async function removeAllBackups(): Promise<number> {
    const result = await apiClient.delete<{ success: boolean; deletedCount: number }>(
        '/backups',
    );
    return result.deletedCount;
}
