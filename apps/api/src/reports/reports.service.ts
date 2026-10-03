import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  SalesReportRow,
  SalesReportSummary,
  CashReportRow,
  CashReportSummary,
  InventoryReportRow,
  DistributorReportRow,
  ExpenseReportRow,
  LineReportRow,
  CollectionsReportRow,
  CollectionsReportSummary,
  OwnerWithdrawalsReportRow,
  OwnerWithdrawalsReportSummary,
} from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import { toMoneyStringRequired } from '../common/utils/money.util';

interface DateRangeQuery {
  dateFrom?: string;
  dateTo?: string;
}

interface SalesReportQuery extends DateRangeQuery {
  distributorId?: string;
  packageId?: string;
  status?: 'ACTIVE' | 'CANCELLED';
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────
  // Sales Report
  // ───────────────────────────────────────────────────────────
  async salesReport(query: SalesReportQuery): Promise<{
    rows: SalesReportRow[];
    summary: SalesReportSummary;
  }> {
    const dateFilter = this.buildDateFilter(query, 'saleDate');

    // المبيعات ACTIVE فقط (default)
    const saleStatus: 'ACTIVE' | 'CANCELLED' = query.status ?? 'ACTIVE';

    const where: Prisma.SaleWhereInput = {
      status: saleStatus,
      ...dateFilter,
      ...(query.distributorId ? { distributorId: query.distributorId } : {}),
      ...(query.packageId
        ? { items: { some: { packageId: query.packageId } } }
        : {}),
    };

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        distributor: { select: { name: true } },
        items: {
          select: {
            packageNameSnapshot: true,
            quantity: true,
            totalPrice: true,
          },
        },
        payments: {
          where: { status: 'ACTIVE' },
          select: { amount: true },
        },
      },
      orderBy: { saleDate: 'desc' },
    });

    const rows: SalesReportRow[] = [];
    let totalSales = new Prisma.Decimal(0);
    let totalPaid = new Prisma.Decimal(0);

    for (const sale of sales) {
      totalSales = totalSales.plus(sale.totalAmount);

      const salePaid = sale.payments.reduce(
        (sum, p) => sum.plus(p.amount),
        new Prisma.Decimal(0),
      );
      totalPaid = totalPaid.plus(salePaid);

      // صف لكل SaleItem (يعرض الباقات)
      for (const item of sale.items) {
        rows.push({
          date: sale.saleDate.toISOString(),
          invoiceNumber: sale.invoiceNumber,
          distributorName: sale.distributor.name,
          packageName: item.packageNameSnapshot,
          quantity: item.quantity,
          total: toMoneyStringRequired(item.totalPrice),
        });
      }
    }

    const totalRemaining = totalSales.minus(totalPaid);

    return {
      rows,
      summary: {
        salesCount: sales.length,
        totalSales: toMoneyStringRequired(totalSales),
        totalPaid: toMoneyStringRequired(totalPaid),
        totalRemaining: toMoneyStringRequired(totalRemaining),
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // Cash Report
  // ───────────────────────────────────────────────────────────
  async cashReport(query: DateRangeQuery): Promise<{
    rows: CashReportRow[];
    summary: CashReportSummary;
  }> {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
    const dateTo = query.dateTo ? new Date(query.dateTo) : null;

    // Opening: كل الحركات قبل dateFrom
    const openingInAgg = dateFrom
      ? await this.prisma.cashMovement.aggregate({
          where: {
            direction: 'IN',
            movementDate: { lt: dateFrom },
          },
          _sum: { amount: true },
        })
      : null;

    const openingOutAgg = dateFrom
      ? await this.prisma.cashMovement.aggregate({
          where: {
            direction: 'OUT',
            movementDate: { lt: dateFrom },
          },
          _sum: { amount: true },
        })
      : null;

    const openingIn = openingInAgg?._sum.amount ?? new Prisma.Decimal(0);
    const openingOut = openingOutAgg?._sum.amount ?? new Prisma.Decimal(0);
    const opening = openingIn.minus(openingOut);

    // Period movements
    const movementWhere: Prisma.CashMovementWhereInput = {
      ...(dateFrom || dateTo
        ? {
            movementDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [movements, inAgg, outAgg] = await Promise.all([
      this.prisma.cashMovement.findMany({
        where: movementWhere,
        orderBy: { movementDate: 'asc' },
      }),
      this.prisma.cashMovement.aggregate({
        where: { ...movementWhere, direction: 'IN' },
        _sum: { amount: true },
      }),
      this.prisma.cashMovement.aggregate({
        where: { ...movementWhere, direction: 'OUT' },
        _sum: { amount: true },
      }),
    ]);

    const totalIn = inAgg._sum.amount ?? new Prisma.Decimal(0);
    const totalOut = outAgg._sum.amount ?? new Prisma.Decimal(0);
    const closing = opening.plus(totalIn).minus(totalOut);

    const rows: CashReportRow[] = movements.map((m) => ({
      date: m.movementDate.toISOString(),
      direction: m.direction,
      sourceType: m.sourceType,
      description: m.description ?? '',
      amount: toMoneyStringRequired(m.amount),
    }));

    return {
      rows,
      summary: {
        opening: toMoneyStringRequired(opening),
        totalIn: toMoneyStringRequired(totalIn),
        totalOut: toMoneyStringRequired(totalOut),
        closing: toMoneyStringRequired(closing),
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // Inventory Report — من ledger movements
  // ───────────────────────────────────────────────────────────
  async inventoryReport(query: DateRangeQuery): Promise<{
    rows: InventoryReportRow[];
  }> {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
    const dateTo = query.dateTo ? new Date(query.dateTo) : null;

    const packages = await this.prisma.package.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const rows: InventoryReportRow[] = [];

    for (const pkg of packages) {
      // Opening: SUM قبل dateFrom
      const openingAgg = dateFrom
        ? await this.prisma.inventoryMovement.aggregate({
            where: {
              packageStock: { packageId: pkg.id },
              createdAt: { lt: dateFrom },
            },
            _sum: { quantityDelta: true },
          })
        : null;

      const opening = openingAgg?._sum.quantityDelta ?? 0;

      // Movements في الفترة
      const movements = await this.prisma.inventoryMovement.findMany({
        where: {
          packageStock: { packageId: pkg.id },
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
        select: { type: true, quantityDelta: true },
      });

      let added = 0;
      let sold = 0;
      let returned = 0;
      let adjusted = 0;

      for (const m of movements) {
        switch (m.type) {
          case 'ADD':
            added += m.quantityDelta;
            break;
          case 'SELL':
            sold += Math.abs(m.quantityDelta);
            break;
          case 'RETURN':
            returned += m.quantityDelta;
            break;
          case 'ADJUSTMENT':
            adjusted += m.quantityDelta;
            break;
        }
      }

      const current = opening + added - sold + returned + adjusted;

      rows.push({
        packageId: pkg.id,
        packageName: pkg.name,
        opening,
        added,
        sold,
        returned,
        adjusted,
        current,
      });
    }

    return { rows };
  }

  // ───────────────────────────────────────────────────────────
  // Distributor Report
  // ───────────────────────────────────────────────────────────
  async distributorsReport(): Promise<{
    rows: DistributorReportRow[];
  }> {
    const distributors = await this.prisma.distributor.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const rows: DistributorReportRow[] = [];

    for (const d of distributors) {
      const [salesAgg, paymentsAgg] = await Promise.all([
        this.prisma.sale.aggregate({
          where: { distributorId: d.id, status: 'ACTIVE' },
          _sum: { totalAmount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            status: 'ACTIVE',
            sale: { distributorId: d.id, status: 'ACTIVE' },
          },
          _sum: { amount: true },
        }),
      ]);

      const totalSales = salesAgg._sum.totalAmount ?? new Prisma.Decimal(0);
      const totalPayments = paymentsAgg._sum.amount ?? new Prisma.Decimal(0);
      const balance = totalSales.minus(totalPayments);

      rows.push({
        distributorId: d.id,
        distributorName: d.name,
        totalSales: toMoneyStringRequired(totalSales),
        totalPayments: toMoneyStringRequired(totalPayments),
        balance: toMoneyStringRequired(balance),
      });
    }

    return { rows };
  }

  // ───────────────────────────────────────────────────────────
  // Expense Report — ACTIVE فقط
  // ───────────────────────────────────────────────────────────
  async expensesReport(query: DateRangeQuery): Promise<{
    rows: ExpenseReportRow[];
  }> {
    const dateFilter = this.buildDateFilter(query, 'expenseDate');

    const categories = await this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const rows: ExpenseReportRow[] = [];

    for (const cat of categories) {
      const agg = await this.prisma.expense.aggregate({
        where: {
          categoryId: cat.id,
          status: 'ACTIVE',
          ...dateFilter,
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const total = agg._sum.amount ?? new Prisma.Decimal(0);
      const count = agg._count.id ?? 0;

      if (count === 0 && total.isZero()) continue;

      rows.push({
        categoryId: cat.id,
        categoryName: cat.name,
        count,
        total: toMoneyStringRequired(total),
      });
    }

    return { rows };
  }

  // ───────────────────────────────────────────────────────────
  // Line Report — ACTIVE payments
  // ───────────────────────────────────────────────────────────
  async linesReport(): Promise<{ rows: LineReportRow[] }> {
    const lines = await this.prisma.line.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, status: true },
    });

    const rows: LineReportRow[] = [];

    for (const line of lines) {
      const payments = await this.prisma.linePayment.findMany({
        where: { lineId: line.id, status: 'ACTIVE' },
        select: { amount: true, paymentDate: true },
      });

      const totalPayments = payments.reduce(
        (sum, p) => sum.plus(p.amount),
        new Prisma.Decimal(0),
      );

      const lastPayment = payments.reduce<Date | null>((latest, p) => {
        return !latest || p.paymentDate > latest ? p.paymentDate : latest;
      }, null);

      rows.push({
        lineId: line.id,
        lineName: line.name,
        totalPayments: toMoneyStringRequired(totalPayments),
        lastPaymentDate: lastPayment ? lastPayment.toISOString() : null,
        status: line.status,
      });
    }

    return { rows };
  }

  // ───────────────────────────────────────────────────────────
  // Collections Report — ACTIVE payments
  // ───────────────────────────────────────────────────────────
  async collectionsReport(query: DateRangeQuery): Promise<{
    rows: CollectionsReportRow[];
    summary: CollectionsReportSummary;
  }> {
    const dateFilter = this.buildDateFilter(query, 'paymentDate');

    const where: Prisma.PaymentWhereInput = {
      status: 'ACTIVE',
      ...dateFilter,
    };

    const [payments, totalAgg] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        include: {
          sale: {
            select: {
              invoiceNumber: true,
              distributor: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const rows: CollectionsReportRow[] = payments.map((p) => ({
      date: p.paymentDate.toISOString(),
      invoiceNumber: p.sale.invoiceNumber,
      distributorName: p.sale.distributor.name,
      amount: toMoneyStringRequired(p.amount),
      status: p.status,
      notes: p.notes,
    }));

    return {
      rows,
      summary: {
        count: totalAgg._count.id ?? 0,
        totalCollected: toMoneyStringRequired(
          totalAgg._sum.amount ?? new Prisma.Decimal(0),
        ),
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // Owner Withdrawals Report — ACTIVE only
  // ───────────────────────────────────────────────────────────
  async ownerWithdrawalsReport(query: DateRangeQuery): Promise<{
    rows: OwnerWithdrawalsReportRow[];
    summary: OwnerWithdrawalsReportSummary;
  }> {
    const dateFilter = this.buildDateFilter(query, 'withdrawalDate');

    const where: Prisma.OwnerWithdrawalWhereInput = {
      status: 'ACTIVE',
      ...dateFilter,
    };

    const [withdrawals, totalAgg] = await Promise.all([
      this.prisma.ownerWithdrawal.findMany({
        where,
        orderBy: { withdrawalDate: 'desc' },
      }),
      this.prisma.ownerWithdrawal.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const rows: OwnerWithdrawalsReportRow[] = withdrawals.map((w) => ({
      date: w.withdrawalDate.toISOString(),
      reason: w.reason,
      amount: toMoneyStringRequired(w.amount),
      status: w.status,
      notes: w.notes,
    }));

    return {
      rows,
      summary: {
        count: totalAgg._count.id ?? 0,
        totalWithdrawn: toMoneyStringRequired(
          totalAgg._sum.amount ?? new Prisma.Decimal(0),
        ),
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────
  private buildDateFilter(
    query: DateRangeQuery,
    field: 'saleDate' | 'expenseDate' | 'paymentDate' | 'withdrawalDate',
  ): Record<string, { gte?: Date; lte?: Date }> {
    if (!query.dateFrom && !query.dateTo) return {};
    return {
      [field]: {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      },
    };
  }
}