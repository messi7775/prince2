import { apiClient } from '../../../lib/api-client';
import type {
    AuditAction,
    AuditLog,
    PaginatedResponse,
    PaginationQuery,
} from '@prince-net/types';
import { endOfDay } from '../../../lib/date-helpers';

interface ListParams extends PaginationQuery {
    search?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export async function listAuditLogs(
    params: ListParams,
): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs', {
        query: {
      search: params.search,
            page: params.page,
            limit: params.limit,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            userId: params.userId,
            dateFrom: params.dateFrom,
            dateTo: endOfDay(params.dateTo),
        },
    });
}
