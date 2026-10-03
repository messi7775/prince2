import { apiClient } from '../../../lib/api-client';
import type { AuditLog } from '@prince-net/types';

export async function getAuditLog(id: string): Promise<AuditLog> {
    return apiClient.get<AuditLog>(`/audit-logs/${id}`);
}
