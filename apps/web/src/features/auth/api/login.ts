import { apiClient } from '../../../lib/api-client';
import type { AuthUser } from '@prince-net/types';
import type { LoginInput } from '@prince-net/validation';

export interface LoginResponse {
  user: AuthUser;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', input);
}