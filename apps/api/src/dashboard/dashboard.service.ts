import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  DashboardData,
  DashboardLowStockAlert,
  DashboardTopPackage,
  DashboardDistributorDebt,
  DashboardRecentTransaction,
} from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import { toMoneyStringRequired } from '../common/utils/money.util';

const TOP_PACKAGES_LIMIT = 5;
const RECENT_TRANSACTIONS_LIMIT = 10;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<DashboardData> {
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
    };
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