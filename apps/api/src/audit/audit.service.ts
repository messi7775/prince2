import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction } from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma';

export interface AuditLogInput {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * AuditService — يكتب سجلات التدقيق.
 *
 * قواعد:
 *  - log()     → prisma.auditLog.create() مباشر (لا transaction داخلية).
 *  - logTx()   → يُستخدم داخل transaction قائمة (مهم للـ modules المالية).
 *  - إذا فشل audit داخل transaction، فشل الـ transaction كلها (لأنه جزء منها).
 *  - خارج transaction، فشل audit يُسجَّل لكن لا يوقف العملية.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: this.buildData(input),
      });
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }

  async logTx(
    tx: Prisma.TransactionClient,
    input: AuditLogInput,
  ): Promise<void> {
    await tx.auditLog.create({
      data: this.buildData(input),
    });
  }

  private buildData(input: AuditLogInput): Prisma.AuditLogCreateInput {
    return {
      user: { connect: { id: input.userId } },
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValues: (input.oldValues ?? null) as Prisma.InputJsonValue,
      newValues: (input.newValues ?? null) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    };
  }
}
