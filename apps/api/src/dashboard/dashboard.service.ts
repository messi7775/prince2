import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  DashboardData,
  DashboardLowStockAlert,
  DashboardTopPackage,
  DashboardDistributorDebt,
  DashboardRecentTransaction,
  DashboardPeriod,
  DashboardPeriodStats,
  DashboardSeriesPoint,
} from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import { toMoneyStringRequired } from '../common/utils/money.util';

const TOP_PACKAGES_LIMIT = 5;
const RECENT_TRANSACTIONS_LIMIT = 10;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(period: DashboardPeriod = 'today'): Promise<DashboardData> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // ─── Today aggregates ───
    const [
      todaySalesAgg,
      todaySalesCount,
      todayPaymentsAgg,
      todayExpensesAgg,
      todayOwnerWithdrawalsAgg,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          status: 'ACTIVE',
          saleDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.sale.count({
        where: {
          status: 'ACTIVE',
          saleDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'ACTIVE',
          paymentDate: { gte: startOfToday, lte: endOfToday },
          sale: { status: 'ACTIVE' },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          status: 'ACTIVE',
          expenseDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
      this.prisma.ownerWithdrawal.aggregate({
        where: {
          status: 'ACTIVE',
          withdrawalDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
    ]);

    const todaySales = todaySalesAgg._sum.totalAmount ?? new Prisma.Decimal(0);
    const todayPayments =
      todayPaymentsAgg._sum.amount ?? new Prisma.Decimal(0);
    const todayExpenses =
      todayExpensesAgg._sum.amount ?? new Prisma.Decimal(0);
    const todayOwnerWithdrawals =
      todayOwnerWithdrawalsAgg._sum.amount ?? new Prisma.Decimal(0);

    // ─── Cash balance ───
    const [cashInAgg, cashOutAgg] = await Promise.all([
      this.prisma.cashMovement.aggregate({
        where: { direction: 'IN' },
        _sum: { amount: true },
      }),
      this.prisma.cashMovement.aggregate({
        where: { direction: 'OUT' },
        _sum: { amount: true },
      }),
    ]);
    const cashBalance = (cashInAgg._sum.amount ?? new Prisma.Decimal(0)).minus(
      cashOutAgg._sum.amount ?? new Prisma.Decimal(0),
    );

    // ─── Current financial summary (excludes REVERSED) ───
    const [
      totalPaymentsAgg,
      totalExpensesAgg,
      totalOwnerWithdrawalsAgg,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'ACTIVE', sale: { status: 'ACTIVE' } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.ownerWithdrawal.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const financialSummary = {
      totalPayments: toMoneyStringRequired(
        totalPaymentsAgg._sum.amount ?? new Prisma.Decimal(0),
      ),
      totalExpenses: toMoneyStringRequired(
        totalExpensesAgg._sum.amount ?? new Prisma.Decimal(0),
      ),
      totalOwnerWithdrawals: toMoneyStringRequired(
        totalOwnerWithdrawalsAgg._sum.amount ?? new Prisma.Decimal(0),
      ),
      cashIn: toMoneyStringRequired(
        cashInAgg._sum.amount ?? new Prisma.Decimal(0),
      ),
      cashOut: toMoneyStringRequired(
        cashOutAgg._sum.amount ?? new Prisma.Decimal(0),
      ),
      cashBalance: toMoneyStringRequired(cashBalance),
      transactionsCount:
        totalPaymentsAgg._count +
        totalExpensesAgg._count +
        totalOwnerWithdrawalsAgg._count,
    };

    // ─── Total distributor debt ───
    const [allSalesAgg, allPaymentsAgg] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'ACTIVE', sale: { status: 'ACTIVE' } },
        _sum: { amount: true },
      }),
    ]);
    const totalDistributorDebt = (
      allSalesAgg._sum.totalAmount ?? new Prisma.Decimal(0)
    ).minus(allPaymentsAgg._sum.amount ?? new Prisma.Decimal(0));

    // ─── Low stock alerts ───
    const settings = await this.prisma.settings.findUnique({
      where: { singletonKey: 'main' },
      select: { lowStockThreshold: true },
    });
    const threshold = settings?.lowStockThreshold ?? 10;

    const lowStockAlerts = await this.computeLowStock(threshold);

    // ─── Top packages (last 30 days) ───
    const topPackagesFrom = new Date(now);
    topPackagesFrom.setDate(topPackagesFrom.getDate() - 29);
    topPackagesFrom.setHours(0, 0, 0, 0);
    const topPackages = await this.buildTopPackages(topPackagesFrom);

    // ─── Distributor debts (top 5) ───
    const distributorDebts = await this.buildDistributorDebts();

    // ─── Period stats (فترة مختارة + مقارنة بالفترة السابقة) ───
    const periodStats = await this.buildPeriodStats(period, now);

    // ─── Series — آخر 14 يومًا (مبيعات/تحصيلات يومية) ───
    const series = await this.buildDailySeries(now);

    // ─── Recent transactions ───
    const recentTransactions = await this.buildRecentTransactions();

    return {
      todaySales: toMoneyStringRequired(todaySales),
      todayPayments: toMoneyStringRequired(todayPayments),
      todayExpenses: toMoneyStringRequired(todayExpenses),
      todayOwnerWithdrawals: toMoneyStringRequired(todayOwnerWithdrawals),
      cashBalance: toMoneyStringRequired(cashBalance),
      totalDistributorDebt: toMoneyStringRequired(totalDistributorDebt),
      todaySalesCount,
      lowStockAlerts,
      topPackages,
      distributorDebts,
      recentTransactions,
      financialSummary,
      periodStats,
      series,
    };
  }

  // ───────────────────────────────────────────────────────────
  // Period Stats — فترة مختارة مع مقارنة بالفترة السابقة
  // Sales ≠ Collections (فصل واضح بين الفواتير والتحصيلات)
  // NetCashFlow = IN - OUT من cash_movements في الفترة
  // ───────────────────────────────────────────────────────────
  private periodRange(
    period: DashboardPeriod,
    now: Date,
  ): { from: Date; to: Date } {
    const to = now;
    let from: Date;

    switch (period) {
      case 'week': {
        from = new Date(now);
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        break;
      }
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      default:
        from = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0,
      );
    }

    return { from, to };
  }

  private async computePeriodNumbers(from: Date, to: Date): Promise<{
    sales: Prisma.Decimal;
    collections: Prisma.Decimal;
    expenses: Prisma.Decimal;
    netCashFlow: Prisma.Decimal;
    salesCount: number;
  }> {
    const [salesAgg, salesCount, collectionsAgg, expensesAgg, cashInAgg, cashOutAgg] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: { status: 'ACTIVE', saleDate: { gte: from, lte: to } },
          _sum: { totalAmount: true },
        }),
        this.prisma.sale.count({
          where: { status: 'ACTIVE', saleDate: { gte: from, lte: to } },
        }),
        this.prisma.payment.aggregate({
          where: {
            status: 'ACTIVE',
            paymentDate: { gte: from, lte: to },
            sale: { status: 'ACTIVE' },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { status: 'ACTIVE', expenseDate: { gte: from, lte: to } },
          _sum: { amount: true },
        }),
        this.prisma.cashMovement.aggregate({
          where: { direction: 'IN', movementDate: { gte: from, lte: to } },
          _sum: { amount: true },
        }),
        this.prisma.cashMovement.aggregate({
          where: { direction: 'OUT', movementDate: { gte: from, lte: to } },
          _sum: { amount: true },
        }),
      ]);

    return {
      sales: salesAgg._sum.totalAmount ?? new Prisma.Decimal(0),
      collections: collectionsAgg._sum.amount ?? new Prisma.Decimal(0),
      expenses: expensesAgg._sum.amount ?? new Prisma.Decimal(0),
      netCashFlow: (cashInAgg._sum.amount ?? new Prisma.Decimal(0)).minus(
        cashOutAgg._sum.amount ?? new Prisma.Decimal(0),
      ),
      salesCount,
    };
  }

  private async buildPeriodStats(
    period: DashboardPeriod,
    now: Date,
  ): Promise<DashboardPeriodStats> {
    const { from, to } = this.periodRange(period, now);
    const current = await this.computePeriodNumbers(from, to);

    // الفترة السابقة بنفس الطول
    const durationMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    const previous = await this.computePeriodNumbers(prevFrom, prevTo);

    const growth = (cur: Prisma.Decimal, prev: Prisma.Decimal): number | null => {
      if (prev.isZero()) return null;
      return Number(cur.minus(prev).div(prev).times(100).toDecimal(2).toString());
    };

    return {
      sales: toMoneyStringRequired(current.sales),
      collections: toMoneyStringRequired(current.collections),
      expenses: toMoneyStringRequired(current.expenses),
      netCashFlow: toMoneyStringRequired(current.netCashFlow),
      salesCount: current.salesCount,
      previous: {
        sales: toMoneyStringRequired(previous.sales),
        collections: toMoneyStringRequired(previous.collections),
        expenses: toMoneyStringRequired(previous.expenses),
        netCashFlow: toMoneyStringRequired(previous.netCashFlow),
      },
      growth: {
        sales: growth(current.sales, previous.sales),
        collections: growth(current.collections, previous.collections),
        expenses: growth(current.expenses, previous.expenses),
        netCashFlow: growth(current.netCashFlow, previous.netCashFlow),
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // Daily Series — آخر 14 يومًا (مبيعات/تحصيلات)
  // ───────────────────────────────────────────────────────────
  private async buildDailySeries(now: Date): Promise<DashboardSeriesPoint[]> {
    const from = new Date(now);
    from.setDate(from.getDate() - 13);
    from.setHours(0, 0, 0, 0);

    const [sales, payments] = await Promise.all([
      this.prisma.sale.findMany({
        where: { status: 'ACTIVE', saleDate: { gte: from, lte: now } },
        select: { saleDate: true, totalAmount: true },
      }),
      this.prisma.payment.findMany({
        where: {
          status: 'ACTIVE',
          paymentDate: { gte: from, lte: now },
          sale: { status: 'ACTIVE' },
        },
        select: { paymentDate: true, amount: true },
      }),
    ]);

    const byDay = new Map<string, { sales: Prisma.Decimal; collections: Prisma.Decimal }>();
    for (let i = 0; i < 14; i += 1) {
      const day = new Date(from);
      day.setDate(day.getDate() + i);
      byDay.set(day.toISOString().slice(0, 10), {
        sales: new Prisma.Decimal(0),
        collections: new Prisma.Decimal(0),
      });
    }

    for (const sale of sales) {
      const key = sale.saleDate.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (bucket) bucket.sales = bucket.sales.plus(sale.totalAmount);
    }
    for (const payment of payments) {
      const key = payment.paymentDate.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (bucket) bucket.collections = bucket.collections.plus(payment.amount);
    }

    return Array.from(byDay.entries()).map(([date, bucket]) => ({
      date,
      sales: toMoneyStringRequired(bucket.sales),
      collections: toMoneyStringRequired(bucket.collections),
    }));
  }

  // ───────────────────────────────────────────────────────────
  // Low Stock
  // ───────────────────────────────────────────────────────────
  private async computeLowStock(
    threshold: number,
  ): Promise<DashboardLowStockAlert[]> {
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

    const alerts: DashboardLowStockAlert[] = [];
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
  // Top Packages
  // ───────────────────────────────────────────────────────────
  private async buildTopPackages(
    from: Date,
  ): Promise<DashboardTopPackage[]> {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: { status: 'ACTIVE', saleDate: { gte: from } },
      },
      select: {
        packageId: true,
        packageNameSnapshot: true,
        quantity: true,
        totalPrice: true,
      },
    });

    const byPackage = new Map<
      string,
      { name: string; quantity: number; total: Prisma.Decimal }
    >();

    for (const item of items) {
      const existing = byPackage.get(item.packageId) ?? {
        name: item.packageNameSnapshot,
        quantity: 0,
        total: new Prisma.Decimal(0),
      };
      existing.quantity += item.quantity;
      existing.total = existing.total.plus(item.totalPrice);
      byPackage.set(item.packageId, existing);
    }

    return Array.from(byPackage.entries())
      .map(([packageId, data]) => ({
        packageId,
        packageName: data.name,
        quantity: data.quantity,
        total: toMoneyStringRequired(data.total),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, TOP_PACKAGES_LIMIT);
  }

  // ───────────────────────────────────────────────────────────
  // Distributor Debts
  // ───────────────────────────────────────────────────────────
  private async buildDistributorDebts(): Promise<DashboardDistributorDebt[]> {
    const distributors = await this.prisma.distributor.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    const debts: DashboardDistributorDebt[] = [];

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

      const sales = salesAgg._sum.totalAmount ?? new Prisma.Decimal(0);
      const payments = paymentsAgg._sum.amount ?? new Prisma.Decimal(0);
      const balance = sales.minus(payments);

      if (balance.gt(0)) {
        debts.push({
          distributorId: d.id,
          distributorName: d.name,
          balance: toMoneyStringRequired(balance),
        });
      }
    }

    return debts
      .sort((a, b) => {
        const aNum = new Prisma.Decimal(a.balance);
        const bNum = new Prisma.Decimal(b.balance);
        return bNum.comparedTo(aNum);
      })
      .slice(0, TOP_PACKAGES_LIMIT);
  }

  // ───────────────────────────────────────────────────────────
  // Recent Transactions
  // ───────────────────────────────────────────────────────────
  private async buildRecentTransactions(): Promise<
    DashboardRecentTransaction[]
  > {
    const movements = await this.prisma.cashMovement.findMany({
      orderBy: { movementDate: 'desc' },
      take: RECENT_TRANSACTIONS_LIMIT,
      select: {
        id: true,
        direction: true,
        amount: true,
        sourceType: true,
        description: true,
        createdAt: true,
      },
    });

    return movements.map((m) => ({
      id: m.id,
      type: m.sourceType,
      description: m.description ?? '',
      amount: toMoneyStringRequired(m.amount),
      direction: m.direction,
      createdAt: m.createdAt.toISOString(),
    }));
  }

}