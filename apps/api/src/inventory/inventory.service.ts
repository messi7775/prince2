import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  InventoryRow,
  InventoryByPackage,
  InventoryMovement,
  PackageStockSummary,
  PaginatedResponse,
  PaginationMeta,
  LowStockAlert,
} from '@prince-net/types';
import type {
  AddInventoryInput,
  AdjustInventoryInput,
  ReturnInventoryInput,
  UpdateBatchInput,
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
import { withSerializableRetry } from '../common/utils/with-serializable-retry';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ───────────────────────────────────────────────────────────
  // Low-stock alerts — الباقات التي وصلت للحد المنخفض
  // ───────────────────────────────────────────────────────────
  async getLowStock(): Promise<LowStockAlert[]> {
    const settings = await this.prisma.settings.findUnique({
      where: { singletonKey: 'main' },
      select: { lowStockThreshold: true },
    });
    const threshold = settings?.lowStockThreshold ?? 10;

    const packages = await this.prisma.package.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    const stocks = await this.prisma.packageStock.findMany({
      select: {
        packageId: true,
        inventoryMovements: {
          select: { quantityDelta: true },
        },
      },
    });

    const stockByPackage = new Map<string, number>();
    for (const stock of stocks) {
      const total = stock.inventoryMovements.reduce(
        (sum, m) => sum + m.quantityDelta,
        0,
      );
      stockByPackage.set(
        stock.packageId,
        (stockByPackage.get(stock.packageId) ?? 0) + total,
      );
    }

    const alerts: LowStockAlert[] = [];
    for (const pkg of packages) {
      const currentStock = stockByPackage.get(pkg.id) ?? 0;
      if (currentStock <= threshold) {
        alerts.push({
          packageId: pkg.id,
          packageName: pkg.name,
          currentStock,
          threshold,
        });
      }
    }

    return alerts;
  }

  // ───────────────────────────────────────────────────────────
  // Overview — قائمة الباقات مع الرصيد الحالي
  // ───────────────────────────────────────────────────────────
  async listOverview(): Promise<InventoryRow[]> {
    const packages = await this.prisma.package.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const stocks = await this.prisma.packageStock.findMany({
      select: {
        id: true,
        packageId: true,
        inventoryMovements: {
          select: { quantityDelta: true },
        },
      },
    });

    const stockByPackage = new Map<string, number>();
    for (const stock of stocks) {
      const total = stock.inventoryMovements.reduce(
        (sum, mv) => sum + mv.quantityDelta,
        0,
      );
      stockByPackage.set(
        stock.packageId,
        (stockByPackage.get(stock.packageId) ?? 0) + total,
      );
    }

    return packages.map((pkg) => ({
      packageStockId: pkg.id,
      packageId: pkg.id,
      packageName: pkg.name,
      currentStock: stockByPackage.get(pkg.id) ?? 0,
    }));
  }

  // ───────────────────────────────────────────────────────────
  // By package — ملخص + batches (بدون movements تفصيلية)
  // ───────────────────────────────────────────────────────────
  async findByPackage(packageId: string): Promise<InventoryByPackage> {
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
      select: { id: true, name: true },
    });
    if (!pkg) {
      throw new NotFoundException({
        message: 'الباقة غير موجودة',
        code: 'PACKAGE_NOT_FOUND',
      });
    }

    const stocks = await this.prisma.packageStock.findMany({
      where: { packageId },
      orderBy: { receivedAt: 'asc' },
      include: {
        inventoryMovements: {
          select: { quantityDelta: true },
        },
      },
    });

    const batches: PackageStockSummary[] = stocks.map((stock) => {
      const currentQuantity = stock.inventoryMovements.reduce(
        (sum, mv) => sum + mv.quantityDelta,
        0,
      );
      return {
        id: stock.id,
        packageId: stock.packageId,
        unitPrice: toMoneyStringRequired(stock.unitPrice),
        receivedAt: stock.receivedAt.toISOString(),
        notes: stock.notes,
        currentQuantity,
        createdBy: stock.createdBy,
        createdAt: stock.createdAt.toISOString(),
      };
    });

    const currentStock = batches.reduce(
      (sum, b) => sum + b.currentQuantity,
      0,
    );

        return {
      packageStockId: stocks[0]?.id ?? packageId,
      packageId: pkg.id,
      packageName: pkg.name,
      currentStock,
      movements: [],
      batches,
    };
  }

  // ───────────────────────────────────────────────────────────
  // Movements list — paginated
  // ───────────────────────────────────────────────────────────
  async listMovements(
    packageId: string,
    query: PaginationInput,
  ): Promise<PaginatedResponse<InventoryMovement>> {
    const { page, limit, skip, take, order } = normalizePagination(query);

    const stocks = await this.prisma.packageStock.findMany({
      where: { packageId },
      select: { id: true },
    });

    const stockIds = stocks.map((s) => s.id);
    if (stockIds.length === 0) {
      return {
        success: true,
        data: [],
        meta: buildPaginationMeta(0, page, limit),
      };
    }

    const where = { packageStockId: { in: stockIds } };

    const [rows, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: order },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    const data: InventoryMovement[] = rows.map((row) => ({
      id: row.id,
      packageStockId: row.packageStockId,
      type: row.type,
      quantityDelta: row.quantityDelta,
      unitPrice: toMoneyStringRequired(row.unitPrice),
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      description: row.description,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    }));

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }

  // ───────────────────────────────────────────────────────────
  // add — إنشاء PackageStock + Movement (transaction)
  // ───────────────────────────────────────────────────────────
  async add(
    input: AddInventoryInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<PackageStockSummary> {
    const pkg = await this.prisma.package.findUnique({
      where: { id: input.packageId },
      select: { id: true, status: true },
    });
    if (!pkg) {
      throw new NotFoundException({
        message: 'الباقة غير موجودة',
        code: 'PACKAGE_NOT_FOUND',
      });
    }
    if (pkg.status !== 'ACTIVE') {
      throw new BusinessException(
        'PACKAGE_INACTIVE',
        'الباقة غير مفعّلة',
        400,
      );
    }

    const unitPrice = new Prisma.Decimal(input.unitPrice);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const stock = await tx.packageStock.create({
        data: {
          packageId: input.packageId,
          unitPrice,
          receivedAt: now,
          notes: input.description ?? null,
          createdBy: userId,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          packageStockId: stock.id,
          type: 'ADD',
          quantityDelta: input.quantity,
          unitPrice,
          referenceType: null,
          referenceId: null,
          description: input.description ?? null,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'INVENTORY_ADDED',
        entityType: 'PackageStock',
        entityId: stock.id,
        newValues: {
          packageId: input.packageId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return { stock, movement };
    });

    return {
      id: result.stock.id,
      packageId: result.stock.packageId,
      unitPrice: toMoneyStringRequired(result.stock.unitPrice),
      receivedAt: result.stock.receivedAt.toISOString(),
      notes: result.stock.notes,
      currentQuantity: result.movement.quantityDelta,
      createdBy: result.stock.createdBy,
      createdAt: result.stock.createdAt.toISOString(),
    };
  }

  // ───────────────────────────────────────────────────────────
  // adjust — Serializable + FOR UPDATE + retry
  // ───────────────────────────────────────────────────────────
  async adjust(
    input: AdjustInventoryInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<InventoryMovement> {
    return withSerializableRetry(async () => {
      return this.prisma.$transaction(
        async (tx) => {
          const locked = await tx.$queryRaw<
            { id: string; unit_price: Prisma.Decimal }[]
          >`
            SELECT id, unit_price
            FROM package_stocks
            WHERE id = ${input.packageStockId}::uuid
            FOR UPDATE
          `;

          if (locked.length === 0) {
            throw new NotFoundException({
              message: 'دفعة المخزون غير موجودة',
              code: 'PACKAGE_STOCK_NOT_FOUND',
            });
          }

          const stock = locked[0]!;

          const agg = await tx.inventoryMovement.aggregate({
            where: { packageStockId: input.packageStockId },
            _sum: { quantityDelta: true },
          });
          const current = agg._sum.quantityDelta ?? 0;

          if (current + input.quantityDelta < 0) {
            throw new BusinessException(
              'INSUFFICIENT_STOCK',
              `الرصيد الحالي ${current}، لا يمكن تعديله بـ ${input.quantityDelta}`,
              400,
            );
          }

          const movement = await tx.inventoryMovement.create({
            data: {
              packageStockId: input.packageStockId,
              type: 'ADJUSTMENT',
              quantityDelta: input.quantityDelta,
              unitPrice: stock.unit_price,
              referenceType: null,
              referenceId: null,
              description: input.description,
              createdBy: userId,
            },
          });

          await this.auditService.logTx(tx, {
            userId,
            action: 'INVENTORY_ADJUSTED',
            entityType: 'PackageStock',
            entityId: input.packageStockId,
            oldValues: { current },
            newValues: {
              delta: input.quantityDelta,
              newCurrent: current + input.quantityDelta,
            },
            ipAddress: req.ip ?? null,
            userAgent: req.userAgent ?? null,
          });

          return {
            id: movement.id,
            packageStockId: movement.packageStockId,
            type: movement.type,
            quantityDelta: movement.quantityDelta,
            unitPrice: toMoneyStringRequired(movement.unitPrice),
            referenceType: movement.referenceType,
            referenceId: movement.referenceId,
            description: movement.description,
            createdBy: movement.createdBy,
            createdAt: movement.createdAt.toISOString(),
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 8000,
        },
      );
    });
  }

  // ───────────────────────────────────────────────────────────
  // return — إعادة كروت إلى batch محدد (موجب دائمًا)
  // ───────────────────────────────────────────────────────────
  async return(
    input: ReturnInventoryInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<InventoryMovement> {
    const stock = await this.prisma.packageStock.findUnique({
      where: { id: input.packageStockId },
      select: { id: true, unitPrice: true },
    });
    if (!stock) {
      throw new NotFoundException({
        message: 'دفعة المخزون غير موجودة',
        code: 'PACKAGE_STOCK_NOT_FOUND',
      });
    }

    const movement = await this.prisma.$transaction(async (tx) => {
      const mv = await tx.inventoryMovement.create({
        data: {
          packageStockId: input.packageStockId,
          type: 'RETURN',
          quantityDelta: input.quantity,
          unitPrice: stock.unitPrice,
          referenceType: null,
          referenceId: null,
          description: input.description ?? null,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'INVENTORY_RETURNED',
        entityType: 'PackageStock',
        entityId: input.packageStockId,
        newValues: { quantity: input.quantity },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return mv;
    });

    return {
      id: movement.id,
      packageStockId: movement.packageStockId,
      type: movement.type,
      quantityDelta: movement.quantityDelta,
      unitPrice: toMoneyStringRequired(movement.unitPrice),
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      description: movement.description,
      createdBy: movement.createdBy,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  // ───────────────────────────────────────────────────────────
  // updateBatch — تعديل سعر الوحدة والملاحظات لدفعة موجودة
  // ───────────────────────────────────────────────────────────
  async updateBatch(
    packageStockId: string,
    input: UpdateBatchInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<PackageStockSummary> {
    const existing = await this.prisma.packageStock.findUnique({
      where: { id: packageStockId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'دفعة المخزون غير موجودة',
        code: 'PACKAGE_STOCK_NOT_FOUND',
      });
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (input.unitPrice !== undefined) {
      const newPrice = new Prisma.Decimal(input.unitPrice);
      if (!newPrice.equals(existing.unitPrice)) {
        oldValues.unitPrice = existing.unitPrice.toString();
        newValues.unitPrice = input.unitPrice;
      }
    }
    if (input.notes !== undefined && input.notes !== existing.notes) {
      oldValues.notes = existing.notes;
      newValues.notes = input.notes;
    }

    if (Object.keys(newValues).length === 0) {
      // No changes — return current state
    } else {
      await this.prisma.packageStock.update({
        where: { id: packageStockId },
        data: {
          ...(input.unitPrice !== undefined
            ? { unitPrice: new Prisma.Decimal(input.unitPrice) }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      await this.auditService.log({
        userId,
        action: 'INVENTORY_BATCH_UPDATED',
        entityType: 'PackageStock',
        entityId: packageStockId,
        oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
        newValues,
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });
    }

    // Return updated summary
    return this.getBatchSummary(packageStockId);
  }

  // ───────────────────────────────────────────────────────────
  // deleteBatch — حذف دفعة (فقط إذا كانت الكمية الحالية صفر)
  // ───────────────────────────────────────────────────────────
  async deleteBatch(
    packageStockId: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean }> {
    const stock = await this.prisma.packageStock.findUnique({
      where: { id: packageStockId },
      select: { id: true, packageId: true },
    });
    if (!stock) {
      throw new NotFoundException({
        message: 'دفعة المخزون غير موجودة',
        code: 'PACKAGE_STOCK_NOT_FOUND',
      });
    }

    // Check current quantity
    const agg = await this.prisma.inventoryMovement.aggregate({
      where: { packageStockId },
      _sum: { quantityDelta: true },
    });
    const currentQuantity = agg._sum.quantityDelta ?? 0;

    if (currentQuantity !== 0) {
      throw new BusinessException(
        'BATCH_NOT_EMPTY',
        'لا يمكن حذف دفعة بها كمية متبقية. استخدم تعديل الكمية لتصفيرها أولاً.',
        400,
      );
    }

    // Check if batch has SELL movements (used in sales)
    const sellMovements = await this.prisma.inventoryMovement.count({
      where: { packageStockId, type: 'SELL' },
    });
    if (sellMovements > 0) {
      throw new BusinessException(
        'BATCH_HAS_SALES',
        'لا يمكن حذف دفعة تم بيع كروت منها. السجل مرتبط بمبيعات.',
        400,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all movements for this batch
      await tx.inventoryMovement.deleteMany({
        where: { packageStockId },
      });

      // Delete the batch itself
      await tx.packageStock.delete({
        where: { id: packageStockId },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'INVENTORY_BATCH_DELETED',
        entityType: 'PackageStock',
        entityId: packageStockId,
        oldValues: { packageId: stock.packageId },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });
    });

    return { success: true };
  }

  // ───────────────────────────────────────────────────────────
  // Helper — get batch summary
  // ───────────────────────────────────────────────────────────
  private async getBatchSummary(
    packageStockId: string,
  ): Promise<PackageStockSummary> {
    const stock = await this.prisma.packageStock.findUnique({
      where: { id: packageStockId },
    });
    if (!stock) {
      throw new NotFoundException({
        message: 'دفعة المخزون غير موجودة',
        code: 'PACKAGE_STOCK_NOT_FOUND',
      });
    }

    const agg = await this.prisma.inventoryMovement.aggregate({
      where: { packageStockId },
      _sum: { quantityDelta: true },
    });

    return {
      id: stock.id,
      packageId: stock.packageId,
      unitPrice: toMoneyStringRequired(stock.unitPrice),
      receivedAt: stock.receivedAt.toISOString(),
      notes: stock.notes,
      currentQuantity: agg._sum.quantityDelta ?? 0,
      createdBy: stock.createdBy,
      createdAt: stock.createdAt.toISOString(),
    };
  }
}