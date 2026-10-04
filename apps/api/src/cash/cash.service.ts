import { dateBoundary, dateRange } from '../common/utils/date-range.util';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  CashBalance,
  CashLedger,
  CashLedgerEntry,
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

export interface CashLedgerQuery {
  dateFrom?: string;
  dateTo?: string;
  sourceType?: string;
  direction?: 'IN' | 'OUT';
  search?: string;
  order?: 'asc' | 'desc';
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
              ...(query.dateFrom ? { gte: dateBoundary(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: dateBoundary(query.dateTo, true) } : {}),
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
  // Ledger — الدفتر المالي الموحد
  // يُبنى من cash_movements فقط. balanceAfter تراكمي في الذاكرة.
  // الحركات المعكوسة موجودة أصلًا في cash_movements كحركات
  // مضادة (REVERSAL) — لا يوجد أي Ledger ثانٍ.
  // ───────────────────────────────────────────────────────────
  async getLedger(query: CashLedgerQuery): Promise<CashLedger> {
    const order: 'asc' | 'desc' = query.order === 'asc' ? 'asc' : 'desc';
    const { from: dateFrom, to: dateTo } = dateRange(query);

    // ─── Opening: رصيد كل الحركات قبل dateFrom ───
    let opening = new Prisma.Decimal(0);
    if (dateFrom) {
      const [beforeIn, beforeOut] = await Promise.all([
        this.prisma.cashMovement.aggregate({
          where: { direction: 'IN', movementDate: { lt: dateFrom } },
          _sum: { amount: true },
        }),
        this.prisma.cashMovement.aggregate({
          where: { direction: 'OUT', movementDate: { lt: dateFrom } },
          _sum: { amount: true },
        }),
      ]);
      opening = (beforeIn._sum.amount ?? new Prisma.Decimal(0)).minus(
        beforeOut._sum.amount ?? new Prisma.Decimal(0),
      );
    }

    const where: Prisma.CashMovementWhereInput = {
      ...(dateFrom || dateTo
        ? {
            movementDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const movements = await this.prisma.cashMovement.findMany({
      where,
      orderBy: [{ movementDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });

    const movementMap = new Map(movements.map((movement) => [movement.id, movement]));

    // ─── مراجع المصادر (روابط للعمليات الأصلية) ───
    const paymentIds = movements
      .filter((m) => m.sourceId && m.sourceType.startsWith('SALE_PAYMENT'))
      .map((m) => m.sourceId as string);
    const expenseIds = movements
      .filter((m) => m.sourceId && m.sourceType.startsWith('EXPENSE'))
      .map((m) => m.sourceId as string);
    const linePaymentIds = movements
      .filter((m) => m.sourceId && m.sourceType.startsWith('LINE_PAYMENT'))
      .map((m) => m.sourceId as string);
    const withdrawalIds = movements
      .filter((m) => m.sourceId && m.sourceType.startsWith('OWNER_WITHDRAWAL'))
      .map((m) => m.sourceId as string);

    const [payments, expenses, linePayments, withdrawals] = await Promise.all([
      paymentIds.length
        ? this.prisma.payment.findMany({
            where: { id: { in: paymentIds } },
            select: {
              id: true,
              sale: { select: { id: true, invoiceNumber: true } },
            },
          })
        : Promise.resolve([]),
      expenseIds.length
        ? this.prisma.expense.findMany({
            where: { id: { in: expenseIds } },
            select: { id: true, description: true },
          })
        : Promise.resolve([]),
      linePaymentIds.length
        ? this.prisma.linePayment.findMany({
            where: { id: { in: linePaymentIds } },
            select: {
              id: true,
              period: true,
              line: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      withdrawalIds.length
        ? this.prisma.ownerWithdrawal.findMany({
            where: { id: { in: withdrawalIds } },
            select: { id: true, reason: true },
          })
        : Promise.resolve([]),
    ]);

    const paymentMap = new Map(payments.map((p) => [p.id, p]));
    const expenseMap = new Map(expenses.map((e) => [e.id, e]));
    const linePaymentMap = new Map(linePayments.map((p) => [p.id, p]));
    const withdrawalMap = new Map(withdrawals.map((w) => [w.id, w]));

    // ─── الرصيد التراكمي + الصفوف ───
    let running = opening;
    let totalIn = new Prisma.Decimal(0);
    let totalOut = new Prisma.Decimal(0);

    const entries: CashLedgerEntry[] = movements.map((m) => {
      const isIn = m.direction === 'IN';
      const inAmount = isIn ? m.amount : new Prisma.Decimal(0);
      const outAmount = isIn ? new Prisma.Decimal(0) : m.amount;
      totalIn = totalIn.plus(inAmount);
      totalOut = totalOut.plus(outAmount);
      running = running.plus(inAmount).minus(outAmount);

      let reference: string | null = null;
      let referenceUrl: string | null = null;

      if (m.sourceId) {
        if (m.sourceType.startsWith('SALE_PAYMENT')) {
          const payment = paymentMap.get(m.sourceId);
          if (payment) {
            reference = `فاتورة ${payment.sale.invoiceNumber}`;
            referenceUrl = `/sales/${payment.sale.id}`;
          }
        } else if (m.sourceType.startsWith('EXPENSE')) {
          const expense = expenseMap.get(m.sourceId);
          if (expense) reference = expense.description;
        } else if (m.sourceType.startsWith('LINE_PAYMENT')) {
          const lp = linePaymentMap.get(m.sourceId);
          if (lp) {
            reference = `خط ${lp.line.name}${lp.period ? ` — ${lp.period}` : ''}`;
            referenceUrl = `/lines/${lp.line.id}`;
          }
        } else if (m.sourceType.startsWith('OWNER_WITHDRAWAL')) {
          const w = withdrawalMap.get(m.sourceId);
          if (w) reference = w.reason;
        }
      }

      return {
        id: m.id,
        date: m.movementDate.toISOString(),
        sourceType: m.sourceType,
        sourceLabel: this.SOURCE_LABELS[m.sourceType] ?? m.sourceType,
        reference,
        referenceUrl,
        description: m.description,
        in: toMoneyStringRequired(inAmount),
        out: toMoneyStringRequired(outAmount),
        balanceAfter: toMoneyStringRequired(running),
      };
    });

    if (order === 'desc') {
      entries.reverse();
    }

    return {
      entries: entries.filter((entry) => {
        const movement = movementMap.get(entry.id)!;
        return (!query.direction || movement.direction === query.direction)
          && (!query.sourceType || movement.sourceType === query.sourceType)
          && (!query.search || (movement.description ?? '').toLocaleLowerCase().includes(query.search.toLocaleLowerCase()));
      }),
      summary: {
        opening: toMoneyStringRequired(opening),
        totalIn: toMoneyStringRequired(totalIn),
        totalOut: toMoneyStringRequired(totalOut),
        closing: toMoneyStringRequired(running),
      },
    };
  }

  private readonly SOURCE_LABELS: Record<string, string> = {
    OPENING: 'رصيد افتتاحي',
    SALE_PAYMENT: 'تحصيل موزع',
    SALE_PAYMENT_REVERSAL: 'عكس تحصيل موزع',
    EXPENSE: 'مصروف',
    EXPENSE_REVERSAL: 'عكس مصروف',
    LINE_PAYMENT: 'دفعة خط',
    LINE_PAYMENT_REVERSAL: 'عكس دفعة خط',
    OWNER_WITHDRAWAL: 'سحب مالك',
    OWNER_WITHDRAWAL_REVERSAL: 'عكس سحب مالك',
    MANUAL: 'حركة يدوية',
  };

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