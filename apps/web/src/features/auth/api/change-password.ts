import { apiClient } from '../../../lib/api-client';
import type { ChangePasswordInput } from '@prince-net/validation';

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  await apiClient.post('/auth/change-password', input);
}