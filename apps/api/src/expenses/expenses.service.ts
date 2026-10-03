import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  Expense,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ReverseExpenseInput,
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

interface ExpenseListQuery extends PaginationInput {
  categoryId?: string;
  status?: 'ACTIVE' | 'REVERSED';
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    query: ExpenseListQuery,
  ): Promise<PaginatedResponse<Expense>> {
    const { page, limit, skip, take, order } = normalizePagination(query);

    const where: Prisma.ExpenseWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            expenseDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { expenseDate: order },
      }),
      this.prisma.expense.count({ where }),
    ]);

    const data: Expense[] = rows.map((row) => this.toExpense(row));
    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);

    return { success: true, data, meta };
  }

  async findById(id: string): Promise<Expense> {
    const row = await this.prisma.expense.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        message: 'المصروف غير موجود',
        code: 'EXPENSE_NOT_FOUND',
      });
    }
    return this.toExpense(row);
  }

  async create(
    input: CreateExpenseInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Expense> {
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.expenseCategory.findUnique({
        where: { id: input.categoryId },
        select: { id: true, name: true, isActive: true },
      });
      if (!category) {
        throw new NotFoundException({
          message: 'تصنيف المصروف غير موجود',
          code: 'EXPENSE_CATEGORY_NOT_FOUND',
        });
      }
      if (!category.isActive) {
        throw new BusinessException(
          'EXPENSE_CATEGORY_INACTIVE',
          'تصنيف المصروف غير مفعّل',
          400,
        );
      }

      const amount = new Prisma.Decimal(input.amount);
      const expenseDate = input.expenseDate
        ? new Date(input.expenseDate)
        : new Date();

      const expense = await tx.expense.create({
        data: {
          categoryId: input.categoryId,
          description: input.description,
          amount,
          status: 'ACTIVE',
          expenseDate,
          notes: input.notes ?? null,
          createdBy: userId,
        },
      });

      await tx.cashMovement.create({
        data: {
          direction: 'OUT',
          amount,
          sourceType: 'EXPENSE',
          sourceId: expense.id,
          description: `مصروف: ${input.description}`,
          movementDate: expenseDate,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'EXPENSE_CREATED',
        entityType: 'Expense',
        entityId: expense.id,
        newValues: {
          categoryId: input.categoryId,
          amount: input.amount,
          description: input.description,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return this.toExpense(expense);
    });
  }

  async update(
    id: string,
    input: UpdateExpenseInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Expense> {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        message: 'المصروف غير موجود',
        code: 'EXPENSE_NOT_FOUND',
      });
    }

    if (existing.status !== 'ACTIVE') {
      throw new BusinessException(
        'EXPENSE_NOT_ACTIVE',
        'لا يمكن تعديل مصروف معكوس',
        400,
      );
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (
      input.description !== undefined &&
      input.description !== existing.description
    ) {
      oldValues.description = existing.description;
      newValues.description = input.description;
    }
    if (input.notes !== undefined && input.notes !== existing.notes) {
      oldValues.notes = existing.notes;
      newValues.notes = input.notes;
    }

    if (Object.keys(newValues).length === 0) {
      return this.toExpense(existing);
    }

    const row = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await this.auditService.log({
      userId,
      action: 'EXPENSE_UPDATED',
      entityType: 'Expense',
      entityId: id,
      oldValues,
      newValues,
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.toExpense(row);
  }

  async delete(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException({
          message: 'المصروف غير موجود',
          code: 'EXPENSE_NOT_FOUND',
        });
      }

      if (existing.status !== 'ACTIVE') {
        throw new BusinessException(
          'EXPENSE_NOT_ACTIVE',
          'لا يمكن حذف مصروف معكوس',
          400,
        );
      }

      await tx.cashMovement.deleteMany({
        where: { sourceType: 'EXPENSE', sourceId: id },
      });

      await tx.expense.delete({ where: { id } });

      await this.auditService.logTx(tx, {
        userId,
        action: 'EXPENSE_DELETED',
        entityType: 'Expense',
        entityId: id,
        oldValues: {
          description: existing.description,
          amount: existing.amount.toString(),
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return { success: true };
    });
  }

  async reverse(
    id: string,
    input: ReverseExpenseInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Expense> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        { id: string; status: string; amount: Prisma.Decimal }[]
      >`
        SELECT id, status, amount
        FROM expenses
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new NotFoundException({
          message: 'المصروف غير موجود',
          code: 'EXPENSE_NOT_FOUND',
        });
      }

      const expense = locked[0]!;

      if (expense.status !== 'ACTIVE') {
        throw new BusinessException(
          'EXPENSE_ALREADY_REVERSED',
          'المصروف معكوس بالفعل',
          400,
        );
      }

      const updated = await tx.expense.update({
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
          amount: expense.amount,
          sourceType: 'EXPENSE_REVERSAL',
          sourceId: id,
          description: `عكس مصروف`,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'EXPENSE_REVERSED',
        entityType: 'Expense',
        entityId: id,
        oldValues: { status: 'ACTIVE' },
        newValues: {
          status: 'REVERSED',
          reason: input.reason,
          amount: expense.amount.toString(),
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return this.toExpense(updated);
    });
  }

  private toExpense(row: {
    id: string;
    categoryId: string;
    description: string;
    amount: Prisma.Decimal;
    status: 'ACTIVE' | 'REVERSED';
    expenseDate: Date;
    notes: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    reversedAt: Date | null;
    reversedBy: string | null;
    reversalReason: string | null;
  }): Expense {
    return {
      id: row.id,
      categoryId: row.categoryId,
      description: row.description,
      amount: toMoneyStringRequired(row.amount),
      status: row.status,
      expenseDate: row.expenseDate.toISOString(),
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      reversedAt: row.reversedAt ? row.reversedAt.toISOString() : null,
      reversedBy: row.reversedBy,
      reversalReason: row.reversalReason,
    };
  }
}