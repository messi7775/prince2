import { apiClient } from '../../../lib/api-client';
import type { OwnerWithdrawal } from '@prince-net/types';
import type { ReverseOwnerWithdrawalInput } from '@prince-net/validation';

interface ReverseParams {
  id: string;
  input: ReverseOwnerWithdrawalInput;
}

export async function reverseOwnerWithdrawal({
  id,
  input,
}: ReverseParams): Promise<OwnerWithdrawal> {
  return apiClient.post<OwnerWithdrawal>(
    `/owner-withdrawals/${id}/reverse`,
    input,
  );
}
