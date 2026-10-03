import { apiClient } from '../../../lib/api-client';
import type { Backup } from '@prince-net/types';

export async function createBackup(): Promise<Backup> {
    return apiClient.post<Backup>('/backups');
}
