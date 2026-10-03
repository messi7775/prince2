import { apiClient } from '../../../lib/api-client';
import type { OwnerWithdrawal } from '@prince-net/types';
import type { CreateOwnerWithdrawalInput } from '@prince-net/validation';

export async function createOwnerWithdrawal(
  input: CreateOwnerWithdrawalInput,
): Promise<OwnerWithdrawal> {
  return apiClient.post<OwnerWithdrawal>('/owner-withdrawals', input);
}
