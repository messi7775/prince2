import { apiClient } from '../../../lib/api-client';
import type { OwnerWithdrawal } from '@prince-net/types';
import type { UpdateOwnerWithdrawalInput } from '@prince-net/validation';

interface UpdateParams {
  id: string;
  input: UpdateOwnerWithdrawalInput;
}

export async function updateOwnerWithdrawal({
  id,
  input,
}: UpdateParams): Promise<OwnerWithdrawal> {
  return apiClient.patch<OwnerWithdrawal>(`/owner-withdrawals/${id}`, input);
}
