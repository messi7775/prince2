import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  OwnerWithdrawal,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import type {
  CreateOwnerWithdrawalInput,
  UpdateOwnerWithdrawalInput,
  ReverseOwnerWithdrawalInput,
} from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessException } from '../common/exceptions/business.exception';
import { toMoneyStringRequired } from '../common/utils/money.util';
import {
  normalizePagination,
  buildPaginationMeta,
  type PaginationInput,
} from '../common/utils/pagination.util';

interface OwnerWithdrawalListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class OwnerWithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    query: OwnerWithdrawalListQuery,
  ): Promise<PaginatedResponse<OwnerWithdrawal>> {
    const { page, limit, skip, take, order } = normalizePagination(query);

    const where: Prisma.OwnerWithdrawalWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            withdrawalDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.ownerWithdrawal.findMany({
        where,
        skip,
        take,
        orderBy: { withdrawalDate: order },
      }),
      this.prisma.ownerWithdrawal.count({ where }),
    ]);

    const data: OwnerWithdrawal[] = rows.map((row) =>
      this.toOwnerWithdrawal(row),
    );
    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);

    return { success: true, data, meta };
  }

  async findById(id: string): Promise<OwnerWithdrawal> {
    const row = await this.prisma.ownerWithdrawal.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'السحب غير موجود',
        code: 'OWNER_WITHDRAWAL_NOT_FOUND',
      });
    }
    return this.toOwnerWithdrawal(row);
  }

  async create(
    input: CreateOwnerWithdrawalInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<OwnerWithdrawal> {
    return this.prisma.$transaction(async (tx) => {
      const amount = new Prisma.Decimal(input.amount);
      const withdrawalDate = input.withdrawalDate
        ? new Date(input.withdrawalDate)
        : new Date();

      const withdrawal = await tx.ownerWithdrawal.create({
        data: {
          amount,
          reason: input.reason,
          status: 'ACTIVE',
          withdrawalDate,
          notes: input.notes ?? null,
          createdBy: userId,
        },
      });

      await tx.cashMovement.create({
        data: {
          direction: 'OUT',
          amount,
          sourceType: 'OWNER_WITHDRAWAL',
          sourceId: withdrawal.id,
          description: `سحب: ${input.reason}`,
          movementDate: withdrawalDate,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'OWNER_WITHDRAWAL_CREATED',
        entityType: 'OwnerWithdrawal',
        entityId: withdrawal.id,
        newValues: {
          amount: input.amount,
          reason: input.reason,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return this.toOwnerWithdrawal(withdrawal);
    });
  }

  async reverse(
    id: string,
    input: ReverseOwnerWithdrawalInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<OwnerWithdrawal> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        { id: string; status: string; amount: Prisma.Decimal }[]
      >`
        SELECT id, status, amount
        FROM owner_withdrawals
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new NotFoundException({
          message: 'السحب غير موجود',
          code: 'OWNER_WITHDRAWAL_NOT_FOUND',
        });
      }

      const withdrawal = locked[0]!;

      if (withdrawal.status !== 'ACTIVE') {
        throw new BusinessException(
          'OWNER_WITHDRAWAL_ALREADY_REVERSED',
          'السحب معكوس بالفعل',
          400,
        );
      }

      const updated = await tx.ownerWithdrawal.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedBy: userId,
          reversalReason: input.reason,
        },
      });

      await tx.cashMovement.create({
        data: {
          direction: 'IN',
          amount: withdrawal.amount,
          sourceType: 'OWNER_WITHDRAWAL_REVERSAL',
          sourceId: id,
          description: `عكس سحب`,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'OWNER_WITHDRAWAL_REVERSED',
        entityType: 'OwnerWithdrawal',
        entityId: id,
        oldValues: { status: 'ACTIVE' },
        newValues: {
          status: 'REVERSED',
          reason: input.reason,
          amount: withdrawal.amount.toString(),
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return this.toOwnerWithdrawal(updated);
    });
  }

  async update(
    id: string,
    input: UpdateOwnerWithdrawalInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<OwnerWithdrawal> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ownerWithdrawal.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException({
          message: 'السحب غير موجود',
          code: 'OWNER_WITHDRAWAL_NOT_FOUND',
        });
      }

      if (existing.status !== 'ACTIVE') {
        throw new BusinessException(
          'OWNER_WITHDRAWAL_NOT_ACTIVE',
          'لا يمكن تعديل سحب معكوس',
          400,
        );
      }

      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (input.amount !== undefined) {
        const newAmount = new Prisma.Decimal(input.amount);
        if (!newAmount.equals(existing.amount)) {
          oldValues.amount = existing.amount.toString();
          newValues.amount = input.amount;
        }
      }
      if (input.reason !== undefined && input.reason !== existing.reason) {
        oldValues.reason = existing.reason;
        newValues.reason = input.reason;
      }
      if (input.notes !== undefined && input.notes !== existing.notes) {
        oldValues.notes = existing.notes;
        newValues.notes = input.notes;
      }
      if (
        input.withdrawalDate !== undefined &&
        input.withdrawalDate.getTime() !== existing.withdrawalDate.getTime()
      ) {
        oldValues.withdrawalDate = existing.withdrawalDate.toISOString();
        newValues.withdrawalDate = input.withdrawalDate.toISOString();
      }

      if (Object.keys(newValues).length === 0) {
        return this.toOwnerWithdrawal(existing);
      }

      const updated = await tx.ownerWithdrawal.update({
        where: { id },
        data: {
          ...(input.amount !== undefined
            ? { amount: new Prisma.Decimal(input.amount) }
            : {}),
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.withdrawalDate !== undefined
            ? { withdrawalDate: input.withdrawalDate }
            : {}),
        },
      });

      // Update associated cash movement
      await tx.cashMovement.updateMany({
        where: { sourceType: 'OWNER_WITHDRAWAL', sourceId: id },
        data: {
          ...(input.amount !== undefined
            ? { amount: new Prisma.Decimal(input.amount) }
            : {}),
          ...(input.withdrawalDate !== undefined
            ? { movementDate: input.withdrawalDate }
            : {}),
          ...(input.reason !== undefined
            ? { description: `سحب: ${input.reason}` }
            : {}),
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'OWNER_WITHDRAWAL_UPDATED',
        entityType: 'OwnerWithdrawal',
        entityId: id,
        oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
        newValues,
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return this.toOwnerWithdrawal(updated);
    });
  }

  async delete(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ownerWithdrawal.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException({
          message: 'السحب غير موجود',
          code: 'OWNER_WITHDRAWAL_NOT_FOUND',
        });
      }

      if (existing.status !== 'ACTIVE') {
        throw new BusinessException(
          'OWNER_WITHDRAWAL_NOT_ACTIVE',
          'لا يمكن حذف سحب معكوس',
          400,
        );
      }

      // Delete associated cash movement
      await tx.cashMovement.deleteMany({
        where: { sourceType: 'OWNER_WITHDRAWAL', sourceId: id },
      });

      await tx.ownerWithdrawal.delete({ where: { id } });

      await this.auditService.logTx(tx, {
        userId,
        action: 'OWNER_WITHDRAWAL_DELETED',
        entityType: 'OwnerWithdrawal',
        entityId: id,
        oldValues: {
          amount: existing.amount.toString(),
          reason: existing.reason,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return { success: true };
    });
  }

  private toOwnerWithdrawal(row: {
    id: string;
    amount: Prisma.Decimal;
    reason: string;
    status: 'ACTIVE' | 'REVERSED';
    withdrawalDate: Date;
    notes: string | null;
    createdBy: string;
    createdAt: Date;
    reversedAt: Date | null;
    reversedBy: string | null;
    reversalReason: string | null;
  }): OwnerWithdrawal {
    return {
      id: row.id,
      amount: toMoneyStringRequired(row.amount),
      reason: row.reason,
      status: row.status,
      withdrawalDate: row.withdrawalDate.toISOString(),
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      reversedAt: row.reversedAt ? row.reversedAt.toISOString() : null,
      reversedBy: row.reversedBy,
      reversalReason: row.reversalReason,
    };
  }
}