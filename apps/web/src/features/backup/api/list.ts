import { apiClient } from '../../../lib/api-client';
import type { Backup } from '@prince-net/types';

export async function listBackups(): Promise<Backup[]> {
    return apiClient.get<Backup[]>('/backups');
}
