import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  Sale,
  SaleDetails,
  SaleItem,
  PaginatedResponse,
  PaginationMeta,
} from '@prince-net/types';
import type {
  CreateSaleInput,
  CancelSaleInput,
  UpdateSaleInput,
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
import {
  withSerializableRetry,
  withInvoiceNumberRetry,
} from '../common/utils/with-serializable-retry';
import { generateInvoiceNumber } from './helpers/invoice-number.helper';
import { allocateFifo } from './helpers/fifo.helper';

interface SaleListQuery extends PaginationInput {
  distributorId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ───────────────────────────────────────────────────────────
  // List — paginated + filters
  // ───────────────────────────────────────────────────────────
  async list(query: SaleListQuery): Promise<PaginatedResponse<Sale>> {
    const { page, limit, skip, take, order } = normalizePagination(query);

    const where: Prisma.SaleWhereInput = {
      ...(query.distributorId ? { distributorId: query.distributorId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            saleDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { saleDate: order },
        include: { distributor: { select: { name: true } } },
      }),
      this.prisma.sale.count({ where }),
    ]);

    const data: Sale[] = rows.map((row) => ({
      ...this.toSale(row),
      distributorName: row.distributor.name,
    }));
    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);

    return { success: true, data, meta };
  }

  // ───────────────────────────────────────────────────────────
  // FindById — SaleDetails مع items + paid + remaining
  // ───────────────────────────────────────────────────────────
  async findById(id: string): Promise<SaleDetails> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        payments: { where: { status: 'ACTIVE' } },
      },
    });

    if (!sale) {
      throw new NotFoundException({
        message: 'الفاتورة غير موجودة',
        code: 'SALE_NOT_FOUND',
      });
    }

    const paidAmount = sale.payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0),
    );
    const remainingAmount = sale.totalAmount.minus(paidAmount);

    const base = this.toSale(sale);
    const items: SaleItem[] = sale.items.map((item) => ({
      id: item.id,
      saleId: item.saleId,
      packageId: item.packageId,
      packageNameSnapshot: item.packageNameSnapshot,
      quantity: item.quantity,
      unitPrice: toMoneyStringRequired(item.unitPrice),
      totalPrice: toMoneyStringRequired(item.totalPrice),
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      ...base,
      items,
      paidAmount: toMoneyStringRequired(paidAmount),
      remainingAmount: toMoneyStringRequired(remainingAmount),
    };
  }

  // ───────────────────────────────────────────────────────────
  // Create — Transaction + FIFO
  // ───────────────────────────────────────────────────────────
  async create(
    input: CreateSaleInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<SaleDetails> {
    return withInvoiceNumberRetry(() =>
      withSerializableRetry(() =>
        this.prisma.$transaction(
          async (tx) => {
            // ─── 1. Validate distributor ───
            const distributor = await tx.distributor.findUnique({
              where: { id: input.distributorId },
              select: { id: true, status: true },
            });
            if (!distributor) {
              throw new NotFoundException({
                message: 'الموزع غير موجود',
                code: 'DISTRIBUTOR_NOT_FOUND',
              });
            }
            if (distributor.status !== 'ACTIVE') {
              throw new BusinessException(
                'DISTRIBUTOR_INACTIVE',
                'الموزع غير مفعّل',
                400,
              );
            }

            // ─── 2. Validate packages + load prices ───
            const packageIds = input.items.map((i) => i.packageId);
            const packages = await tx.package.findMany({
              where: { id: { in: packageIds } },
              select: {
                id: true,
                name: true,
                price: true,
                status: true,
              },
            });

            const packageMap = new Map(packages.map((p) => [p.id, p]));

            for (const item of input.items) {
              const pkg = packageMap.get(item.packageId);
              if (!pkg) {
                throw new NotFoundException({
                  message: `الباقة ${item.packageId} غير موجودة`,
                  code: 'PACKAGE_NOT_FOUND',
                });
              }
              if (pkg.status !== 'ACTIVE') {
                throw new BusinessException(
                  'PACKAGE_INACTIVE',
                  `الباقة ${pkg.name} غير مفعّلة`,
                  400,
                );
              }
            }

            // ─── 3. FIFO allocations لكل item ───
            const allAllocations: Array<{
              packageId: string;
              allocations: Awaited<ReturnType<typeof allocateFifo>>;
            }> = [];

            for (const item of input.items) {
              const allocations = await allocateFifo(
                tx,
                item.packageId,
                item.quantity,
              );
              allAllocations.push({
                packageId: item.packageId,
                allocations,
              });
            }

            // ─── 4. Calculate totals from FIFO allocation prices (سعر الشدة) ───
            let totalAmount = new Prisma.Decimal(0);
            const itemData: Array<{
              packageId: string;
              packageNameSnapshot: string;
              quantity: number;
              unitPrice: Prisma.Decimal;
              totalPrice: Prisma.Decimal;
            }> = [];

            for (let idx = 0; idx < input.items.length; idx++) {
              const item = input.items[idx];
              const pkg = packageMap.get(item.packageId)!;
              const allocs = allAllocations[idx].allocations;

              let itemTotal = new Prisma.Decimal(0);
              for (const alloc of allocs) {
                itemTotal = itemTotal.plus(
                  alloc.unitPrice.mul(alloc.quantity),
                );
              }
              const unitPrice = itemTotal.div(item.quantity);
              totalAmount = totalAmount.plus(itemTotal);

              itemData.push({
                packageId: item.packageId,
                packageNameSnapshot: pkg.name,
                quantity: item.quantity,
                unitPrice,
                totalPrice: itemTotal,
              });
            }

            // ─── 5. Initial payment validation ───
            const initialPayment = input.initialPayment
              ? new Prisma.Decimal(input.initialPayment)
              : null;

            if (initialPayment && initialPayment.gt(totalAmount)) {
              throw new BusinessException(
                'OVERPAYMENT',
                'الدفعة الأولية أكبر من إجمالي الفاتورة',
                400,
              );
            }

            // ─── 6. Generate invoice number ───
            const invoiceNumber = await generateInvoiceNumber(tx);

            // ─── 7. Create Sale ───
            const sale = await tx.sale.create({
              data: {
                invoiceNumber,
                distributorId: input.distributorId,
                totalAmount,
                status: 'ACTIVE',
                saleDate: new Date(),
                notes: input.notes ?? null,
                createdBy: userId,
              },
            });

            // ─── 8. Create SaleItems ───
            for (const item of itemData) {
              await tx.saleItem.create({
                data: {
                  saleId: sale.id,
                  packageId: item.packageId,
                  packageNameSnapshot: item.packageNameSnapshot,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                },
              });
            }

            // ─── 9. Create initial Payment (إن وُجد) ───
            let paymentId: string | null = null;
            if (initialPayment) {
              const payment = await tx.payment.create({
                data: {
                  saleId: sale.id,
                  amount: initialPayment,
                  status: 'ACTIVE',
                  paymentDate: new Date(),
                  notes: null,
                  createdBy: userId,
                },
              });
              paymentId = payment.id;

              await tx.cashMovement.create({
                data: {
                  direction: 'IN',
                  amount: initialPayment,
                  sourceType: 'SALE_PAYMENT',
                  sourceId: payment.id,
                  description: `دفعة أولية لفاتورة ${invoiceNumber}`,
                  createdBy: userId,
                },
              });
            }

            // ─── 10. Create InventoryMovement(SELL) لكل allocation ───
            for (const item of allAllocations) {
              for (const alloc of item.allocations) {
                await tx.inventoryMovement.create({
                  data: {
                    packageStockId: alloc.packageStockId,
                    type: 'SELL',
                    quantityDelta: -alloc.quantity,
                    unitPrice: alloc.unitPrice,
                    referenceType: 'Sale',
                    referenceId: sale.id,
                    description: `بيع من فاتورة ${invoiceNumber}`,
                    createdBy: userId,
                  },
                });
              }
            }

            // ─── 11. Audit ───
            await this.auditService.logTx(tx, {
              userId,
              action: 'SALE_CREATED',
              entityType: 'Sale',
              entityId: sale.id,
              newValues: {
                invoiceNumber,
                distributorId: input.distributorId,
                totalAmount: totalAmount.toString(),
                itemsCount: input.items.length,
                ...(paymentId ? { initialPaymentId: paymentId } : {}),
              },
              ipAddress: req.ip ?? null,
              userAgent: req.userAgent ?? null,
            });

            return { sale, invoiceNumber };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 15000,
          },
        ),
      ),
    ).then(({ sale }) => this.findById(sale.id));
  }

  // ───────────────────────────────────────────────────────────
  // Cancel — Transaction مع lock + reverse + restore
  // ───────────────────────────────────────────────────────────
  async cancel(
    saleId: string,
    input: CancelSaleInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<SaleDetails> {
    return this.prisma.$transaction(
      async (tx) => {
        // ─── 1. Lock Sale first ───
        const locked = await tx.$queryRaw<{ id: string; status: string }[]>`
          SELECT id, status
          FROM sales
          WHERE id = ${saleId}::uuid
          FOR UPDATE
        `;

        if (locked.length === 0) {
          throw new NotFoundException({
            message: 'الفاتورة غير موجودة',
            code: 'SALE_NOT_FOUND',
          });
        }

        const saleRow = locked[0]!;
        if (saleRow.status !== 'ACTIVE') {
          throw new BusinessException(
            'SALE_ALREADY_CANCELLED',
            'الفاتورة ملغاة بالفعل',
            400,
          );
        }

        // ─── 2. Load Sale + items + payments ───
        const sale = await tx.sale.findUnique({
          where: { id: saleId },
          include: {
            items: true,
            payments: true,
          },
        });
        if (!sale) {
          throw new NotFoundException({
            message: 'الفاتورة غير موجودة',
            code: 'SALE_NOT_FOUND',
          });
        }

        // ─── 3. Load SELL movements ───
        const sellMovements = await tx.inventoryMovement.findMany({
          where: {
            referenceType: 'Sale',
            referenceId: saleId,
            type: 'SELL',
          },
        });

        // ─── 4. Lock affected PackageStock بترتيب deterministic ───
        const stockIds = Array.from(
          new Set(sellMovements.map((m) => m.packageStockId)),
        ).sort();

        if (stockIds.length > 0) {
          await tx.$queryRaw`
            SELECT id FROM package_stocks
            WHERE id = ANY(${stockIds}::uuid[])
            ORDER BY id ASC
            FOR UPDATE
          `;
        }

        // ─── 5. Reverse all ACTIVE payments ───
        const activePayments = sale.payments.filter(
          (p) => p.status === 'ACTIVE',
        );

        for (const payment of activePayments) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'REVERSED',
              reversedAt: new Date(),
              reversedBy: userId,
              reversalReason: input.reason,
            },
          });

          await tx.cashMovement.create({
            data: {
              direction: 'OUT',
              amount: payment.amount,
              sourceType: 'SALE_PAYMENT_REVERSAL',
              sourceId: payment.id,
              description: `عكس دفعة بسبب إلغاء الفاتورة ${sale.invoiceNumber}`,
              createdBy: userId,
            },
          });
        }

        // ─── 6. Restore inventory ───
        for (const sell of sellMovements) {
          await tx.inventoryMovement.create({
            data: {
              packageStockId: sell.packageStockId,
              type: 'RETURN',
              quantityDelta: Math.abs(sell.quantityDelta),
              unitPrice: sell.unitPrice,
              referenceType: 'Sale',
              referenceId: saleId,
              description: `إرجاع مخزون بسبب إلغاء ${sale.invoiceNumber}`,
              createdBy: userId,
            },
          });
        }

        // ─── 7. Cancel Sale ───
        await tx.sale.update({
          where: { id: saleId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: input.reason,
          },
        });

        // ─── 8. Audit ───
        await this.auditService.logTx(tx, {
          userId,
          action: 'SALE_CANCELLED',
          entityType: 'Sale',
          entityId: saleId,
          oldValues: { status: 'ACTIVE' },
          newValues: {
            status: 'CANCELLED',
            reason: input.reason,
            reversedPayments: activePayments.length,
            restoredMovements: sellMovements.length,
          },
          ipAddress: req.ip ?? null,
          userAgent: req.userAgent ?? null,
        });

        return saleId;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      },
    ).then((id) => this.findById(id));
  }

  // ───────────────────────────────────────────────────────────
  // Update — تعديل بنود الفاتورة (items + notes) مع إعادة تخصيص FIFO
  // ───────────────────────────────────────────────────────────
  async update(
    saleId: string,
    input: UpdateSaleInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<SaleDetails> {
    return withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          // ─── 1. Lock Sale ───
          const locked = await tx.$queryRaw<
            { id: string; status: string; invoice_number: string }[]
          >`
            SELECT id, status, invoice_number
            FROM sales
            WHERE id = ${saleId}::uuid
            FOR UPDATE
          `;

          if (locked.length === 0) {
            throw new NotFoundException({
              message: 'الفاتورة غير موجودة',
              code: 'SALE_NOT_FOUND',
            });
          }

          if (locked[0]!.status !== 'ACTIVE') {
            throw new BusinessException(
              'SALE_NOT_ACTIVE',
              'لا يمكن تعديل فاتورة ملغاة',
              400,
            );
          }

          const invoiceNumber = locked[0]!.invoice_number;

          // ─── 2. Load existing sale + items + payments ───
          const sale = await tx.sale.findUnique({
            where: { id: saleId },
            include: { items: true, payments: true },
          });
          if (!sale) {
            throw new NotFoundException({
              message: 'الفاتورة غير موجودة',
              code: 'SALE_NOT_FOUND',
            });
          }

          // ─── 3. Validate new packages ───
          const packageIds = input.items.map((i) => i.packageId);
          const packages = await tx.package.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true, price: true, status: true },
          });
          const packageMap = new Map(packages.map((p) => [p.id, p]));

          for (const item of input.items) {
            const pkg = packageMap.get(item.packageId);
            if (!pkg) {
              throw new NotFoundException({
                message: `الباقة ${item.packageId} غير موجودة`,
                code: 'PACKAGE_NOT_FOUND',
              });
            }
            if (pkg.status !== 'ACTIVE') {
              throw new BusinessException(
                'PACKAGE_INACTIVE',
                `الباقة ${pkg.name} غير مفعّلة`,
                400,
              );
            }
          }

          // ─── 4. Reverse old SELL movements (restore inventory) ───
          const oldSellMovements = await tx.inventoryMovement.findMany({
            where: {
              referenceType: 'Sale',
              referenceId: saleId,
              type: 'SELL',
            },
          });

          // Lock affected stocks
          const oldStockIds = Array.from(
            new Set(oldSellMovements.map((m) => m.packageStockId)),
          ).sort();
          if (oldStockIds.length > 0) {
            await tx.$queryRaw`
              SELECT id FROM package_stocks
              WHERE id = ANY(${oldStockIds}::uuid[])
              ORDER BY id ASC
              FOR UPDATE
            `;
          }

          for (const sell of oldSellMovements) {
            await tx.inventoryMovement.create({
              data: {
                packageStockId: sell.packageStockId,
                type: 'RETURN',
                quantityDelta: Math.abs(sell.quantityDelta),
                unitPrice: sell.unitPrice,
                referenceType: 'Sale',
                referenceId: saleId,
                description: `إرجاع مخزون بسبب تعديل الفاتورة ${invoiceNumber}`,
                createdBy: userId,
              },
            });
          }

          // ─── 5. Delete old sale items ───
          await tx.saleItem.deleteMany({
            where: { saleId },
          });

          // ─── 6. Delete old SELL movements ───
          await tx.inventoryMovement.deleteMany({
            where: {
              referenceType: 'Sale',
              referenceId: saleId,
              type: 'SELL',
            },
          });

          // ─── 7. FIFO allocate new items ───
          const allAllocations: Array<{
            packageId: string;
            allocations: Awaited<ReturnType<typeof allocateFifo>>;
          }> = [];

          for (const item of input.items) {
            const allocations = await allocateFifo(
              tx,
              item.packageId,
              item.quantity,
            );
            allAllocations.push({
              packageId: item.packageId,
              allocations,
            });
          }

          // ─── 8. Calculate new totals from FIFO allocation prices (سعر الشدة) + create sale items ───
          let totalAmount = new Prisma.Decimal(0);
          for (let idx = 0; idx < input.items.length; idx++) {
            const item = input.items[idx];
            const pkg = packageMap.get(item.packageId)!;
            const allocs = allAllocations[idx].allocations;

            let itemTotal = new Prisma.Decimal(0);
            for (const alloc of allocs) {
              itemTotal = itemTotal.plus(
                alloc.unitPrice.mul(alloc.quantity),
              );
            }
            const unitPrice = itemTotal.div(item.quantity);
            totalAmount = totalAmount.plus(itemTotal);

            await tx.saleItem.create({
              data: {
                saleId,
                packageId: item.packageId,
                packageNameSnapshot: pkg.name,
                quantity: item.quantity,
                unitPrice,
                totalPrice: itemTotal,
              },
            });
          }

          // ─── 9. Check paid amount vs new total ───
          const paidAmount = sale.payments
            .filter((p) => p.status === 'ACTIVE')
            .reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));

          if (paidAmount.gt(totalAmount)) {
            throw new BusinessException(
              'PAID_EXCEEDS_NEW_TOTAL',
              `المبلغ المدفوع (${paidAmount.toString()}) أكبر من الإجمالي الجديد (${totalAmount.toString()}). يجب عكس الدفعات الزائدة أولاً.`,
              400,
            );
          }

          // ─── 10. Update sale ───
          await tx.sale.update({
            where: { id: saleId },
            data: {
              totalAmount,
              notes: input.notes ?? sale.notes,
            },
          });

          // ─── 11. Create new SELL movements ───
          for (const item of allAllocations) {
            for (const alloc of item.allocations) {
              await tx.inventoryMovement.create({
                data: {
                  packageStockId: alloc.packageStockId,
                  type: 'SELL',
                  quantityDelta: -alloc.quantity,
                  unitPrice: alloc.unitPrice,
                  referenceType: 'Sale',
                  referenceId: saleId,
                  description: `بيع من فاتورة ${invoiceNumber} (معدّلة)`,
                  createdBy: userId,
                },
              });
            }
          }

          // ─── 12. Audit ───
          await this.auditService.logTx(tx, {
            userId,
            action: 'SALE_UPDATED',
            entityType: 'Sale',
            entityId: saleId,
            oldValues: {
              totalAmount: sale.totalAmount.toString(),
              itemsCount: sale.items.length,
            },
            newValues: {
              totalAmount: totalAmount.toString(),
              itemsCount: input.items.length,
            },
            ipAddress: req.ip ?? null,
            userAgent: req.userAgent ?? null,
          });

          return saleId;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      ),
    ).then((id) => this.findById(id));
  }

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────
  private toSale(row: {
    id: string;
    invoiceNumber: string;
    distributorId: string;
    totalAmount: Prisma.Decimal;
    status: 'ACTIVE' | 'CANCELLED';
    saleDate: Date;
    notes: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    cancelledAt: Date | null;
    cancelledBy: string | null;
    cancellationReason: string | null;
  }): Sale {
    return {
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      distributorId: row.distributorId,
      totalAmount: toMoneyStringRequired(row.totalAmount),
      status: row.status,
      saleDate: row.saleDate.toISOString(),
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
      cancelledBy: row.cancelledBy,
      cancellationReason: row.cancellationReason,
    };
  }
}