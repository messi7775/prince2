import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  CashBalance,
  CashMovement,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import type {
  ManualCashInInput,
  ManualCashOutInput,
} from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { toMoneyStringRequired } from '../common/utils/money.util';
import {
  normalizePagination,
  buildPaginationMeta,
  type PaginationInput,
} from '../common/utils/pagination.util';

interface CashMovementListQuery extends PaginationInput {
  direction?: 'IN' | 'OUT';
  sourceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class CashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ───────────────────────────────────────────────────────────
  // Balance — SUM(IN) - SUM(OUT)
  // ───────────────────────────────────────────────────────────
  async getBalance(): Promise<CashBalance> {
    const [inAgg, outAgg] = await Promise.all([
      this.prisma.cashMovement.aggregate({
        where: { direction: 'IN' },
        _sum: { amount: true },
      }),
      this.prisma.cashMovement.aggregate({
        where: { direction: 'OUT' },
        _sum: { amount: true },
      }),
    ]);

    const totalIn = inAgg._sum.amount ?? new Prisma.Decimal(0);
    const totalOut = outAgg._sum.amount ?? new Prisma.Decimal(0);
    const balance = totalIn.minus(totalOut);

    return {
      totalIn: toMoneyStringRequired(totalIn),
      totalOut: toMoneyStringRequired(totalOut),
      balance: toMoneyStringRequired(balance),
    };
  }

  // ───────────────────────────────────────────────────────────
  // Movements list — paginated + filters
  // ───────────────────────────────────────────────────────────
  async listMovements(
    query: CashMovementListQuery,
  ): Promise<PaginatedResponse<CashMovement>> {
    const { page, limit, skip, take, order } = normalizePagination(query);

    const where: Prisma.CashMovementWhereInput = {
      ...(query.direction ? { direction: query.direction } : {}),
      ...(query.sourceType ? { sourceType: query.sourceType as never } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            movementDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.cashMovement.findMany({
        where,
        skip,
        take,
        orderBy: { movementDate: order },
      }),
      this.prisma.cashMovement.count({ where }),
    ]);

    const data: CashMovement[] = rows.map((row) => ({
      id: row.id,
      direction: row.direction,
      amount: toMoneyStringRequired(row.amount),
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      description: row.description,
      movementDate: row.movementDate.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    }));

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }

  // ───────────────────────────────────────────────────────────
  // Manual IN
  // ───────────────────────────────────────────────────────────
  async manualIn(
    input: ManualCashInInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<CashMovement> {
    return this.prisma.$transaction(async (tx) => {
      const amount = new Prisma.Decimal(input.amount);
      const movementDate = input.movementDate
        ? new Date(input.movementDate)
        : new Date();

      const movement = await tx.cashMovement.create({
        data: {
          direction: 'IN',
          amount,
          sourceType: 'MANUAL',
          sourceId: null,
          description: input.description,
          movementDate,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'CASH_MANUAL_IN',
        entityType: 'CashMovement',
        entityId: movement.id,
        newValues: {
          amount: input.amount,
          description: input.description,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return {
        id: movement.id,
        direction: movement.direction,
        amount: toMoneyStringRequired(movement.amount),
        sourceType: movement.sourceType,
        sourceId: movement.sourceId,
        description: movement.description,
        movementDate: movement.movementDate.toISOString(),
        createdBy: movement.createdBy,
        createdAt: movement.createdAt.toISOString(),
      };
    });
  }

  // ───────────────────────────────────────────────────────────
  // Manual OUT — لا يمنع الرصيد السالب
  // ───────────────────────────────────────────────────────────
  async manualOut(
    input: ManualCashOutInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<CashMovement> {
    return this.prisma.$transaction(async (tx) => {
      const amount = new Prisma.Decimal(input.amount);
      const movementDate = input.movementDate
        ? new Date(input.movementDate)
        : new Date();

      const movement = await tx.cashMovement.create({
        data: {
          direction: 'OUT',
          amount,
          sourceType: 'MANUAL',
          sourceId: null,
          description: input.description,
          movementDate,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'CASH_MANUAL_OUT',
        entityType: 'CashMovement',
        entityId: movement.id,
        newValues: {
          amount: input.amount,
          description: input.description,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return {
        id: movement.id,
        direction: movement.direction,
        amount: toMoneyStringRequired(movement.amount),
        sourceType: movement.sourceType,
        sourceId: movement.sourceId,
        description: movement.description,
        movementDate: movement.movementDate.toISOString(),
        createdBy: movement.createdBy,
        createdAt: movement.createdAt.toISOString(),
      };
    });
  }
}