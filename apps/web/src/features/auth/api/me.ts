import { apiClient } from '../../../lib/api-client';
import type { AuthUser } from '@prince-net/types';

export interface MeResponse {
  user: AuthUser;
}

export async function fetchMe(): Promise<MeResponse> {
  return apiClient.get<MeResponse>('/auth/me');
}