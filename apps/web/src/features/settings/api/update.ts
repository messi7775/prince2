import { apiClient } from '../../../lib/api-client';
import type { Settings } from '@prince-net/types';
import type { UpdateSettingsInput } from '@prince-net/validation';

export async function updateSettings(
    input: UpdateSettingsInput,
): Promise<Settings> {
    return apiClient.patch<Settings>('/settings', input);
}
