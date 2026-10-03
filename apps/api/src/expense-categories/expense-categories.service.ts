import { Injectable, NotFoundException } from '@nestjs/common';
import type { ExpenseCategory } from '@prince-net/types';
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessException } from '../common/exceptions/business.exception';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(): Promise<ExpenseCategory[]> {
    const rows = await this.prisma.expenseCategory.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async findById(id: string): Promise<ExpenseCategory> {
    const row = await this.prisma.expenseCategory.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'تصنيف المصروف غير موجود',
        code: 'EXPENSE_CATEGORY_NOT_FOUND',
      });
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    input: CreateExpenseCategoryInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<ExpenseCategory> {
    const row = await this.prisma.expenseCategory.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        isActive: true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'EXPENSE_CATEGORY_CREATED',
      entityType: 'ExpenseCategory',
      entityId: row.id,
      newValues: { name: row.name, description: row.description },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.toDto(row);
  }

  async update(
    id: string,
    input: UpdateExpenseCategoryInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<ExpenseCategory> {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'تصنيف المصروف غير موجود',
        code: 'EXPENSE_CATEGORY_NOT_FOUND',
      });
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (input.name !== undefined && input.name !== existing.name) {
      oldValues.name = existing.name;
      newValues.name = input.name;
    }
    if (
      input.description !== undefined &&
      input.description !== existing.description
    ) {
      oldValues.description = existing.description;
      newValues.description = input.description;
    }

    const row = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
      },
    });

    if (Object.keys(newValues).length > 0) {
      await this.auditService.log({
        userId,
        action: 'EXPENSE_CATEGORY_UPDATED',
        entityType: 'ExpenseCategory',
        entityId: id,
        oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
        newValues,
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });
    }

    return this.toDto(row);
  }

  async activate(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<ExpenseCategory> {
    return this.setActive(id, true, userId, req, 'EXPENSE_CATEGORY_ACTIVATED');
  }

  async deactivate(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<ExpenseCategory> {
    return this.setActive(id, false, userId, req, 'EXPENSE_CATEGORY_DEACTIVATED');
  }

  private async setActive(
    id: string,
    isActive: boolean,
    userId: string,
    req: { ip?: string; userAgent?: string },
    action: 'EXPENSE_CATEGORY_ACTIVATED' | 'EXPENSE_CATEGORY_DEACTIVATED',
  ): Promise<ExpenseCategory> {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'تصنيف المصروف غير موجود',
        code: 'EXPENSE_CATEGORY_NOT_FOUND',
      });
    }

    if (existing.isActive === isActive) {
      return this.toDto(existing);
    }

    const row = await this.prisma.expenseCategory.update({
      where: { id },
      data: { isActive },
    });

    await this.auditService.log({
      userId,
      action,
      entityType: 'ExpenseCategory',
      entityId: id,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.toDto(row);
  }

  async delete(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'تصنيف المصروف غير موجود',
        code: 'EXPENSE_CATEGORY_NOT_FOUND',
      });
    }

    if (existing._count.expenses > 0) {
      throw new BusinessException(
        'EXPENSE_CATEGORY_HAS_EXPENSES',
        'لا يمكن حذف تصنيف مرتبط بمصروفات سابقة. استخدم التعطيل بدلاً من ذلك.',
        400,
      );
    }

    await this.prisma.expenseCategory.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'EXPENSE_CATEGORY_DELETED',
      entityType: 'ExpenseCategory',
      entityId: id,
      oldValues: { name: existing.name, description: existing.description },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return { success: true };
  }

  private toDto(row: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ExpenseCategory {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}