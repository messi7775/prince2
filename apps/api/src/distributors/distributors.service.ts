import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import type {
  Distributor,
  DistributorBalance,
  DistributorStatement,
  DistributorStatementEntry,
  DistributorStatementEntryType,
  PaginatedResponse,
  PaginationMeta,
  Sale,
  Payment,
} from '@prince-net/types';
import type {
  CreateDistributorInput,
  UpdateDistributorInput,
} from '@prince-net/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { toMoneyStringRequired } from '../common/utils/money.util';
import {
  normalizePagination,
  buildPaginationMeta,
  type PaginationInput,
} from '../common/utils/pagination.util';

interface ListQuery extends PaginationInput {
  status?: 'ACTIVE' | 'INACTIVE';
}

@Injectable()
export class DistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListQuery): Promise<PaginatedResponse<Distributor>> {
    const { page, limit, skip, take, search, order } =
      normalizePagination(query);

    const where: Prisma.DistributorWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.distributor.findMany({
        where,
        skip,
        take,
        orderBy: { name: order },
      }),
      this.prisma.distributor.count({ where }),
    ]);

    const data: Distributor[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      status: row.status,
      registrationDate: row.registrationDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }

  async findById(id: string): Promise<Distributor> {
    const row = await this.prisma.distributor.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        message: 'الموزع غير موجود',
        code: 'DISTRIBUTOR_NOT_FOUND',
      });
    }
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      status: row.status,
      registrationDate: row.registrationDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    input: CreateDistributorInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Distributor> {
    const row = await this.prisma.distributor.create({
      data: {
        name: input.name,
        phone: input.phone,
        address: input.address ?? null,
        notes: input.notes ?? null,
        status: 'ACTIVE',
      },
    });

    await this.auditService.log({
      userId,
      action: 'DISTRIBUTOR_CREATED',
      entityType: 'Distributor',
      entityId: row.id,
      newValues: { name: row.name, phone: row.phone },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.findById(row.id);
  }

  async update(
    id: string,
    input: UpdateDistributorInput,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Distributor> {
    const existing = await this.prisma.distributor.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'الموزع غير موجود',
        code: 'DISTRIBUTOR_NOT_FOUND',
      });
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (input.name !== undefined && input.name !== existing.name) {
      oldValues.name = existing.name;
      newValues.name = input.name;
    }
    if (input.phone !== undefined && input.phone !== existing.phone) {
      oldValues.phone = existing.phone;
      newValues.phone = input.phone;
    }
    if (input.address !== undefined && input.address !== existing.address) {
      oldValues.address = existing.address;
      newValues.address = input.address;
    }
    if (input.notes !== undefined && input.notes !== existing.notes) {
      oldValues.notes = existing.notes;
      newValues.notes = input.notes;
    }

    await this.prisma.distributor.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await this.auditService.log({
      userId,
      action: 'DISTRIBUTOR_UPDATED',
      entityType: 'Distributor',
      entityId: id,
      oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
      newValues: Object.keys(newValues).length > 0 ? newValues : null,
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.findById(id);
  }

  async activate(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Distributor> {
    return this.setStatus(id, 'ACTIVE', userId, req);
  }

  async deactivate(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Distributor> {
    return this.setStatus(id, 'INACTIVE', userId, req);
  }

  private async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Distributor> {
    const existing = await this.prisma.distributor.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'الموزع غير موجود',
        code: 'DISTRIBUTOR_NOT_FOUND',
      });
    }

    if (existing.status === status) {
      return this.findById(id);
    }

    await this.prisma.distributor.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      userId,
      action:
        status === 'ACTIVE'
          ? 'DISTRIBUTOR_ACTIVATED'
          : 'DISTRIBUTOR_DEACTIVATED',
      entityType: 'Distributor',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return this.findById(id);
  }

  // ───────────────────────────────────────────────────────────
  // getBalance — عبر العلاقات الفعلية
  // ───────────────────────────────────────────────────────────
  async getBalance(id: string): Promise<DistributorBalance> {
    const exists = await this.prisma.distributor.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException({
        message: 'الموزع غير موجود',
        code: 'DISTRIBUTOR_NOT_FOUND',
      });
    }

    const [salesAgg, paymentsAgg] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { distributorId: id, status: 'ACTIVE' },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'ACTIVE',
          sale: { distributorId: id, status: 'ACTIVE' },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalSales = salesAgg._sum.totalAmount ?? new Prisma.Decimal(0);
    const totalPayments = paymentsAgg._sum.amount ?? new Prisma.Decimal(0);
    const balance = totalSales.minus(totalPayments);

    return {
      distributorId: id,
      totalSales: toMoneyStringRequired(totalSales),
      totalPayments: toMoneyStringRequired(totalPayments),
      balance: toMoneyStringRequired(balance),
    };
  }

  // ───────────────────────────────────────────────────────────
  // getStatement — كشف حساب الموزع
  // يُحسب من الـ Ledger الحالي (sales + payments):
  //   - فاتورة ACTIVE  → debit (مدين)
  //   - دفعة ACTIVE     → credit (دائن)
  //   - فاتورة ملغاة / دفعة معكوسة → تُعرض فقط، بلا أثر على الرصيد.
  // لا يُخزَّن أي رصيد — balanceAfter تراكمي في الذاكرة.
  // ───────────────────────────────────────────────────────────
  async getStatement(
    id: string,
    query: {
      dateFrom?: string;
      dateTo?: string;
      order?: 'asc' | 'desc';
    },
  ): Promise<DistributorStatement> {
    const exists = await this.prisma.distributor.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException({
        message: 'الموزع غير موجود',
        code: 'DISTRIBUTOR_NOT_FOUND',
      });
    }

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
    const dateTo = query.dateTo ? new Date(query.dateTo) : null;
    const order: 'asc' | 'desc' = query.order === 'asc' ? 'asc' : 'desc';

    // ─── كل الأحداث المؤثرة (ACTIVE) — كامل التاريخ لحساب الافتتاحي ───
    const [sales, payments] = await Promise.all([
      this.prisma.sale.findMany({
        where: { distributorId: id },
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
          saleDate: true,
        },
        orderBy: { saleDate: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { sale: { distributorId: id } },
        select: {
          id: true,
          amount: true,
          status: true,
          paymentDate: true,
          saleId: true,
          sale: { select: { id: true, invoiceNumber: true, status: true } },
        },
        orderBy: { paymentDate: 'asc' },
      }),
    ]);

    type RawEntry = {
      date: Date;
      entryType: DistributorStatementEntryType;
      reference: string;
      referenceUrl: string;
      amount: Prisma.Decimal;
      status: string;
      effective: boolean;
      debit: boolean;
    };

    const raw: RawEntry[] = [];

    for (const sale of sales) {
      raw.push({
        date: sale.saleDate,
        entryType: sale.status === 'ACTIVE' ? 'SALE' : 'SALE_CANCELLED',
        reference: sale.invoiceNumber,
        referenceUrl: `/sales/${sale.id}`,
        amount: sale.totalAmount,
        status: sale.status,
        effective: sale.status === 'ACTIVE',
        debit: true,
      });
    }

    for (const payment of payments) {
      const active = payment.status === 'ACTIVE' && payment.sale.status === 'ACTIVE';
      raw.push({
        date: payment.paymentDate,
        entryType: active ? 'PAYMENT' : 'PAYMENT_REVERSED',
        reference: `دفعة — ${payment.sale.invoiceNumber}`,
        referenceUrl: `/sales/${payment.sale.id}`,
        amount: payment.amount,
        status: payment.status,
        effective: active,
        debit: false,
      });
    }

    // ترتيب زمني مستقر: التاريخ ثم النوع (فاتورة قبل دفعة بنفس اللحظة)
    raw.sort((a, b) => a.date.getTime() - b.date.getTime());

    // ─── Opening balance: رصيد الأحداث المؤثرة قبل dateFrom ───
    let running = new Prisma.Decimal(0);
    const inRange: RawEntry[] = [];

    for (const entry of raw) {
      if (!entry.effective) {
        // الملغاة/المعكوسة قبل الفترة تُتجاهل كليًا
        if (
          dateFrom &&
          entry.date.getTime() < dateFrom.getTime()
        ) {
          continue;
        }
        if (
          dateTo &&
          entry.date.getTime() > dateTo.getTime()
        ) {
          continue;
        }
        inRange.push(entry);
        continue;
      }

      if (dateFrom && entry.date.getTime() < dateFrom.getTime()) {
        running = entry.debit
          ? running.plus(entry.amount)
          : running.minus(entry.amount);
        continue;
      }
      if (dateTo && entry.date.getTime() > dateTo.getTime()) {
        continue;
      }
      inRange.push(entry);
    }

    const openingBalance = running;

    // ─── بناء الصفوف مع الرصيد التراكمي ───
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    const entries: DistributorStatementEntry[] = inRange.map((entry) => {
      const debit = entry.effective && entry.debit
        ? entry.amount
        : new Prisma.Decimal(0);
      const credit = entry.effective && !entry.debit
        ? entry.amount
        : new Prisma.Decimal(0);

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);
      running = running.plus(debit).minus(credit);

      return {
        id: `${entry.entryType}-${entry.reference}`,
        entryType: entry.entryType,
        date: entry.date.toISOString(),
        reference: entry.reference,
        referenceUrl: entry.referenceUrl,
        debit: toMoneyStringRequired(debit),
        credit: toMoneyStringRequired(credit),
        balanceAfter: toMoneyStringRequired(running),
        status: entry.status,
      };
    });

    if (order === 'desc') {
      entries.reverse();
    }

    return {
      entries,
      summary: {
        openingBalance: toMoneyStringRequired(openingBalance),
        totalDebit: toMoneyStringRequired(totalDebit),
        totalCredit: toMoneyStringRequired(totalCredit),
        closingBalance: toMoneyStringRequired(running),
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // getSales — مبيعات الموزع (paginated)
  // ───────────────────────────────────────────────────────────
  async getSales(
    id: string,
    query: PaginationInput,
  ): Promise<PaginatedResponse<Sale>> {
    await this.findById(id);

    const { page, limit, skip, take, order } = normalizePagination(query);
    const where = { distributorId: id };

    const [rows, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { saleDate: order },
        include: {
          payments: {
            where: { status: 'ACTIVE' },
            select: { amount: true },
          },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    const data: Sale[] = rows.map((row) => {
      const paidAmount = row.payments.reduce(
        (sum, p) => sum.plus(p.amount),
        new Prisma.Decimal(0),
      );
      const remainingAmount = row.totalAmount.minus(paidAmount);
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
        paidAmount: toMoneyStringRequired(paidAmount),
        remainingAmount: toMoneyStringRequired(remainingAmount),
      };
    });

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }

  // ───────────────────────────────────────────────────────────
  // getPayments — دفعات مبيعات الموزع (paginated)
  // ───────────────────────────────────────────────────────────
  async getPayments(
    id: string,
    query: PaginationInput,
  ): Promise<PaginatedResponse<Payment>> {
    await this.findById(id);

    const { page, limit, skip, take, order } = normalizePagination(query);
    const where = {
      sale: { distributorId: id },
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { paymentDate: order },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const data: Payment[] = rows.map((row) => ({
      id: row.id,
      saleId: row.saleId,
      amount: toMoneyStringRequired(row.amount),
      status: row.status,
      paymentDate: row.paymentDate.toISOString(),
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      reversedAt: row.reversedAt ? row.reversedAt.toISOString() : null,
      reversedBy: row.reversedBy,
      reversalReason: row.reversalReason,
    }));

    const meta: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { success: true, data, meta };
  }
}