import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  AuditLog,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  normalizePagination,
  buildPaginationMeta,
  type PaginationInput,
} from '../common/utils/pagination.util';

interface AuditListQuery extends PaginationInput {
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AuditReadService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AuditListQuery,
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page, limit, skip, take, search } = normalizePagination(query);

    const entityIdSearch = search && /^[0-9a-fA-F-]{36}$/.test(search) ? search : undefined;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action as never } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { entityType: { contains: search, mode: 'insensitive' as const } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
              ...(entityIdSearch ? [{ entityId: { equals: entityIdSearch } }] : []),
              { ipAddress: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const data: AuditLog[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userEmail: row.user?.email ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      oldValues: (row.oldValues as Record<string, unknown> | null) ?? null,
      newValues: (row.newValues as Record<string, unknown> | null) ?? null,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    }));

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }

  async findById(id: string): Promise<AuditLog> {
    const row = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
      },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'السجل غير موجود',
        code: 'AUDIT_LOG_NOT_FOUND',
      });
    }

    return {
      id: row.id,
      userId: row.userId,
      userEmail: row.user?.email ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      oldValues: (row.oldValues as Record<string, unknown> | null) ?? null,
      newValues: (row.newValues as Record<string, unknown> | null) ?? null,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
