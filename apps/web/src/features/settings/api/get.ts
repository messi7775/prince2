import { apiClient } from '../../../lib/api-client';
import type { Settings } from '@prince-net/types';

export async function getSettings(): Promise<Settings> {
    return apiClient.get<Settings>('/settings');
}
