import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  AppNotification,
  NotificationsResponse,
} from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import { toMoneyStringRequired } from '../common/utils/money.util';

/**
 * مركز التنبيهات — يُحسب عند الطلب من البيانات الحالية.
 * لا يُخزَّن أي تنبيه ولا يُكرر أي سجل.
 * كل تنبيه = نوع واحد مع عدّاد، لمنع الإزعاج والتكرار.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<NotificationsResponse> {
    const now = new Date();

    // ─── إعداد الفترات ───
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthName = now.toLocaleString('ar', { month: 'long' });

    // ─── 1. مخزون منخفض ───
    const settings = await this.prisma.settings.findUnique({
      where: { singletonKey: 'main' },
      select: { lowStockThreshold: true },
    });
    const threshold = settings?.lowStockThreshold ?? 10;

    const stocks = await this.prisma.packageStock.findMany({
      select: { packageId: true, inventoryMovements: { select: { quantityDelta: true } } },
    });
    const stockByPackage = new Map<string, number>();
    for (const stock of stocks) {
      const total = stock.inventoryMovements.reduce((s, m) => s + m.quantityDelta, 0);
      stockByPackage.set(stock.packageId, (stockByPackage.get(stock.packageId) ?? 0) + total);
    }

    const lowStockPackages = await this.prisma.package.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    const lowStock = lowStockPackages.filter(
      (p) => (stockByPackage.get(p.id) ?? 0) <= threshold,
    );

    // ─── 2. فواتير غير مدفوعة ───
    const activeSales = await this.prisma.sale.findMany({
      where: { status: 'ACTIVE' },
      select: {
        totalAmount: true,
        payments: { where: { status: 'ACTIVE' }, select: { amount: true } },
      },
    });
    let unpaidCount = 0;
    let unpaidRemaining = new Prisma.Decimal(0);
    for (const sale of activeSales) {
      const paid = sale.payments.reduce(
        (sum, p) => sum.plus(p.amount),
        new Prisma.Decimal(0),
      );
      const remaining = sale.totalAmount.minus(paid);
      if (remaining.gt(0)) {
        unpaidCount += 1;
        unpaidRemaining = unpaidRemaining.plus(remaining);
      }
    }

    // ─── 3. أرصدة موزعين مرتفعة ───
    const distributors = await this.prisma.distributor.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    let indebtedCount = 0;
    let totalDebt = new Prisma.Decimal(0);
    for (const d of distributors) {
      const [salesAgg, paymentsAgg] = await Promise.all([
        this.prisma.sale.aggregate({
          where: { distributorId: d.id, status: 'ACTIVE' },
          _sum: { totalAmount: true },
        }),
        this.prisma.payment.aggregate({
          where: { status: 'ACTIVE', sale: { distributorId: d.id, status: 'ACTIVE' } },
          _sum: { amount: true },
        }),
      ]);
      const balance = (salesAgg._sum.totalAmount ?? new Prisma.Decimal(0)).minus(
        paymentsAgg._sum.amount ?? new Prisma.Decimal(0),
      );
      if (balance.gt(0)) {
        indebtedCount += 1;
        totalDebt = totalDebt.plus(balance);
      }
    }

    // ─── 4. خطوط لم تُدفع للفترة الحالية ───
    const lines = await this.prisma.line.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    const unpaidLines: string[] = [];
    for (const line of lines) {
      const paid = await this.prisma.linePayment.count({
        where: {
          lineId: line.id,
          status: 'ACTIVE',
          paymentDate: { gte: monthStart },
        },
      });
      if (paid === 0) unpaidLines.push(line.name);
    }

    // ─── 5. فرق صندوق ───
    const closingsWithDiff = await this.prisma.cashClosing.count({
      where: { difference: { not: 0 } },
    });

    // ─── 6. عمليات عكس حديثة ───
    const recentReversals = await this.prisma.auditLog.count({
      where: {
        createdAt: { gte: weekAgo },
        action: {
          in: [
            'PAYMENT_REVERSED',
            'EXPENSE_REVERSED',
            'LINE_PAYMENT_REVERSED',
            'OWNER_WITHDRAWAL_REVERSED',
            'SALE_CANCELLED',
          ],
        },
      },
    });

    // ─── بناء التنبيهات ───
    const notifications: AppNotification[] = [];

    if (lowStock.length > 0) {
      notifications.push({
        id: 'LOW_STOCK',
        type: 'LOW_STOCK',
        severity: 'warning',
        title: 'مخزون منخفض',
        description: `${lowStock.length} باقة عند/تحت حد التنبيه (${threshold})`,
        url: '/inventory',
        count: lowStock.length,
      });
    }

    if (unpaidCount > 0) {
      notifications.push({
        id: 'UNPAID_INVOICES',
        type: 'UNPAID_INVOICES',
        severity: 'info',
        title: 'فواتير غير مدفوعة',
        description: `${unpaidCount} فاتورة بمتبقٍ ${toMoneyStringRequired(unpaidRemaining)}`,
        url: '/sales',
        count: unpaidCount,
        amount: toMoneyStringRequired(unpaidRemaining),
      });
    }

    if (indebtedCount > 0) {
      notifications.push({
        id: 'HIGH_BALANCE',
        type: 'HIGH_BALANCE',
        severity: 'warning',
        title: 'أرصدة موزعين مستحقة',
        description: `${indebtedCount} موزع عليهم ${toMoneyStringRequired(totalDebt)}`,
        url: '/distributors',
        count: indebtedCount,
        amount: toMoneyStringRequired(totalDebt),
      });
    }

    if (unpaidLines.length > 0) {
      notifications.push({
        id: 'LINE_UNPAID',
        type: 'LINE_UNPAID',
        severity: 'warning',
        title: 'خطوط غير مدفوعة',
        description: `${unpaidLines.length} خط لم يُدفع خلال ${monthName} الحالي`,
        url: '/lines',
        count: unpaidLines.length,
      });
    }

    if (closingsWithDiff > 0) {
      notifications.push({
        id: 'CASH_DIFFERENCE',
        type: 'CASH_DIFFERENCE',
        severity: 'critical',
        title: 'فرق صندوق',
        description: `${closingsWithDiff} إغلاق يومي بفرق عن الرصيد المتوقع`,
        url: '/cash-closings',
        count: closingsWithDiff,
      });
    }

    if (recentReversals > 0) {
      notifications.push({
        id: 'REVERSALS',
        type: 'REVERSALS',
        severity: 'info',
        title: 'عمليات عكس حديثة',
        description: `${recentReversals} عملية عكس/إلغاء خلال آخر 7 أيام`,
        url: '/audit-log',
        count: recentReversals,
      });
    }

    return {
      notifications,
      count: notifications.length,
      lastCheckedAt: now.toISOString(),
    };
  }
}
