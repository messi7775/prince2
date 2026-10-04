import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  CashClosing,
  CashClosingPreview,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import type {
  CreateCashClosingInput,
  PaginationInput,
} from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { toMoneyStringRequired } from '../common/utils/money.util';
import {
  normalizePagination,
  buildPaginationMeta,
} from '../common/utils/pagination.util';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface ClosingListQuery extends PaginationInput {
  dateFrom?: string;
  dateTo?: string;
}

/**
 * إغلاق الصندوق اليومي.
 *
 * القواعد:
 *  - كل الأرقام (opening/IN/OUT/سحوبات/متوقع) تُحسب من cash_movements
 *    لحظة الإغلاق ثم تُجمَّد كلقطة في cash_closings.
 *  - لا يمكن إغلاق نفس اليوم مرتين (unique closing_date).
 *  - لا يمكن إغلاق تاريخ مستقبلي.
 *  - السجل لا يُعدَّل ولا يُحذف بعد الإنشاء (Financial Immutability) —
 *    أي فرق يظهر في خانة difference.
 *  - عملية الإغلاق تُسجَّل في Audit Log.
 */
@Injectable()
export class CashClosingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ───────────────────────────────────────────────────────────
  // Helper — أرقام اليوم من cash_movements
  // ───────────────────────────────────────────────────────────
  private async computeDayNumbers(
    tx: Prisma.TransactionClient,
    closingDate: string,
  ): Promise<{
    opening: Prisma.Decimal;
    totalIn: Prisma.Decimal;
    totalOut: Prisma.Decimal;
    ownerWithdrawals: Prisma.Decimal;
    expected: Prisma.Decimal;
  }> {
    const dayStart = new Date(`${closingDate}T00:00:00`);
    const dayEnd = new Date(`${closingDate}T23:59:59.999`);

    const [
      beforeIn,
      beforeOut,
      dayIn,
      dayOutAll,
      dayWithdrawals,
    ] = await Promise.all([
      tx.cashMovement.aggregate({
        where: { direction: 'IN', movementDate: { lt: dayStart } },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: { direction: 'OUT', movementDate: { lt: dayStart } },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          direction: 'IN',
          movementDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          direction: 'OUT',
          movementDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      }),
      tx.cashMovement.aggregate({
        where: {
          direction: 'OUT',
          sourceType: 'OWNER_WITHDRAWAL',
          movementDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const opening = (beforeIn._sum.amount ?? new Prisma.Decimal(0)).minus(
      beforeOut._sum.amount ?? new Prisma.Decimal(0),
    );
    const totalIn = dayIn._sum.amount ?? new Prisma.Decimal(0);
    const ownerWithdrawals =
      dayWithdrawals._sum.amount ?? new Prisma.Decimal(0);
    const totalOut = (dayOutAll._sum.amount ?? new Prisma.Decimal(0)).minus(
      ownerWithdrawals,
    );
    const expected = opening
      .plus(totalIn)
      .minus(totalOut)
      .minus(ownerWithdrawals);

    return { opening, totalIn, totalOut, ownerWithdrawals, expected };
  }

  private validateDate(closingDate: string): void {
    if (!DATE_REGEX.test(closingDate)) {
      throw new BadRequestException({
        message: 'تاريخ الإغلاق غير صالح (YYYY-MM-DD)',
        code: 'INVALID_CLOSING_DATE',
      });
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (closingDate > todayStr) {
      throw new BadRequestException({
        message: 'لا يمكن إغلاق تاريخ مستقبلي',
        code: 'FUTURE_CLOSING_DATE',
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // Preview — أرقام اليوم المتوقعة قبل الإغلاق
  // ───────────────────────────────────────────────────────────
  async preview(closingDate: string): Promise<CashClosingPreview> {
    this.validateDate(closingDate);

    const existing = await this.prisma.cashClosing.findUnique({
      where: { closingDate: new Date(`${closingDate}T00:00:00`) },
      select: { id: true },
    });

    const numbers = await this.computeDayNumbers(
      this.prisma,
      closingDate,
    );

    return {
      closingDate,
      openingBalance: toMoneyStringRequired(numbers.opening),
      totalIn: toMoneyStringRequired(numbers.totalIn),
      totalOut: toMoneyStringRequired(numbers.totalOut),
      ownerWithdrawals: toMoneyStringRequired(numbers.ownerWithdrawals),
      expectedBalance: toMoneyStringRequired(numbers.expected),
      alreadyClosed: existing !== null,
    };
  }

  // ───────────────────────────────────────────────────────────
  // List — الأيام المغلقة (paginated)
  // ───────────────────────────────────────────────────────────
  async list(query: ClosingListQuery): Promise<PaginatedResponse<CashClosing>> {
    const { page, limit, skip, take, order } = normalizePagination(query);

    const where = {
      ...(query.dateFrom || query.dateTo
        ? {
            closingDate: {
              ...(query.dateFrom
                ? { gte: new Date(`${query.dateFrom}T00:00:00`) }
                : {}),
              ...(query.dateTo
                ? { lte: new Date(`${query.dateTo}T00:00:00`) }
                : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.cashClosing.findMany({
        where,
        skip,
        take,
        orderBy: { closingDate: order },
        include: { closedByUser: { select: { email: true } } },
      }),
      this.prisma.cashClosing.count({ where }),
    ]);

    const data: CashClosing[] = rows.map((row) => ({
      id: row.id,
      closingDate: row.closingDate.toISOString().slice(0, 10),
      openingBalance: toMoneyStringRequired(row.openingBalance),
      totalIn: toMoneyStringRequired(row.totalIn),
      totalOut: toMoneyStringRequired(row.totalOut),
      ownerWithdrawals: toMoneyStringRequired(row.ownerWithdrawals),
      expectedBalance: toMoneyStringRequired(row.expectedBalance),
      actualBalance: toMoneyStringRequired(row.actualBalance),
      difference: toMoneyStringRequired(row.difference),
      notes: row.notes,
      closedBy: row.closedBy,
      closedByEmail: row.closedByUser?.email ?? null,
      closedAt: row.closedAt.toISOString(),
    }));

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }

  // ───────────────────────────────────────────────────────────
  // Create — إغلاق يوم (transaction + Audit)
  // ───────────────────────────────────────────────────────────
  async create(
    input: CreateCashClosingInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<CashClosing> {
    this.validateDate(input.closingDate);
    const closingDate = new Date(`${input.closingDate}T00:00:00`);

    const created = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cashClosing.findUnique({
        where: { closingDate },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException({
          message: 'هذا اليوم مغلق بالفعل',
          code: 'CLOSING_ALREADY_EXISTS',
        });
      }

      const numbers = await this.computeDayNumbers(
        tx,
        input.closingDate,
      );

      const actualBalance = new Prisma.Decimal(input.actualBalance);
      const difference = actualBalance.minus(numbers.expected);

      const row = await tx.cashClosing.create({
        data: {
          closingDate,
          openingBalance: numbers.opening,
          totalIn: numbers.totalIn,
          totalOut: numbers.totalOut,
          ownerWithdrawals: numbers.ownerWithdrawals,
          expectedBalance: numbers.expected,
          actualBalance,
          difference,
          notes: input.notes ?? null,
          closedBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'CASH_CLOSING_CREATED',
        entityType: 'CashClosing',
        entityId: row.id,
        newValues: {
          closingDate: input.closingDate,
          openingBalance: toMoneyStringRequired(numbers.opening),
          totalIn: toMoneyStringRequired(numbers.totalIn),
          totalOut: toMoneyStringRequired(numbers.totalOut),
          ownerWithdrawals: toMoneyStringRequired(numbers.ownerWithdrawals),
          expectedBalance: toMoneyStringRequired(numbers.expected),
          actualBalance: toMoneyStringRequired(actualBalance),
          difference: toMoneyStringRequired(difference),
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return row;
    });

    return {
      id: created.id,
      closingDate: created.closingDate.toISOString().slice(0, 10),
      openingBalance: toMoneyStringRequired(created.openingBalance),
      totalIn: toMoneyStringRequired(created.totalIn),
      totalOut: toMoneyStringRequired(created.totalOut),
      ownerWithdrawals: toMoneyStringRequired(created.ownerWithdrawals),
      expectedBalance: toMoneyStringRequired(created.expectedBalance),
      actualBalance: toMoneyStringRequired(created.actualBalance),
      difference: toMoneyStringRequired(created.difference),
      notes: created.notes,
      closedBy: created.closedBy,
      closedByEmail: null,
      closedAt: created.closedAt.toISOString(),
    };
  }

  // ───────────────────────────────────────────────────────────
  // FindById
  // ───────────────────────────────────────────────────────────
  async findById(id: string): Promise<CashClosing> {
    const row = await this.prisma.cashClosing.findUnique({
      where: { id },
      include: { closedByUser: { select: { email: true } } },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'سجل الإغلاق غير موجود',
        code: 'CASH_CLOSING_NOT_FOUND',
      });
    }

    return {
      id: row.id,
      closingDate: row.closingDate.toISOString().slice(0, 10),
      openingBalance: toMoneyStringRequired(row.openingBalance),
      totalIn: toMoneyStringRequired(row.totalIn),
      totalOut: toMoneyStringRequired(row.totalOut),
      ownerWithdrawals: toMoneyStringRequired(row.ownerWithdrawals),
      expectedBalance: toMoneyStringRequired(row.expectedBalance),
      actualBalance: toMoneyStringRequired(row.actualBalance),
      difference: toMoneyStringRequired(row.difference),
      notes: row.notes,
      closedBy: row.closedBy,
      closedByEmail: row.closedByUser?.email ?? null,
      closedAt: row.closedAt.toISOString(),
    };
  }
}
