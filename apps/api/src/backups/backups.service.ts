import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Prisma } from '../generated/prisma';
import type { Backup } from '@prince-net/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessException } from '../common/exceptions/business.exception';

const SNAPSHOT_VERSION = 2;

/**
 * جداول الـ snapshot بالترتيب:
 *  - INSERT_ORDER   = ترتيب إدراج حسب تبعيات FK (الأب قبل الابن)
 *  - WIPE_ORDER     = عكس INSERT_ORDER (الابن قبل الأب)
 *
 * ملاحظة: جدول backups نفسه لا يُمسّ (تاريخ النسخ محفوظ)،
 * وجدول users يُدمج بـ upsert (لا يُحذف) لأنه مرجع FK لـ backups
 * ولأن حساب الجلسة الحالية يجب أن يبقى صالحًا بعد الاستعادة.
 */
const INSERT_ORDER = [
  'packages',
  'distributors',
  'settings',
  'packageStocks',
  'sales',
  'saleItems',
  'payments',
  'lines',
  'linePayments',
  'expenseCategories',
  'expenses',
  'ownerWithdrawals',
  'inventoryMovements',
  'cashMovements',
  'cashClosings',
  'auditLogs',
] as const;

type SnapshotModel = (typeof INSERT_ORDER)[number];

const DMMF_MODEL_NAMES: Record<SnapshotModel, string> = {
  packages: 'Package',
  distributors: 'Distributor',
  settings: 'Settings',
  packageStocks: 'PackageStock',
  sales: 'Sale',
  saleItems: 'SaleItem',
  payments: 'Payment',
  lines: 'Line',
  linePayments: 'LinePayment',
  expenseCategories: 'ExpenseCategory',
  expenses: 'Expense',
  ownerWithdrawals: 'OwnerWithdrawal',
  inventoryMovements: 'InventoryMovement',
  cashMovements: 'CashMovement',
  cashClosings: 'CashClosing',
  auditLogs: 'AuditLog',
};

interface SnapshotDelegate {
  findMany(): Promise<Record<string, unknown>[]>;
  deleteMany(): Promise<number>;
  createMany(args: { data: Record<string, unknown>[] }): Promise<{ count: number }>;
}

/**
 * اسم خاصية الـ delegate على PrismaClient/TransactionClient —
 * أسماء النماذج مفردة (prisma.sale وليس prisma.sales).
 */
const PRISMA_DELEGATES: Record<SnapshotModel | 'users', string> = {
  packages: 'package',
  distributors: 'distributor',
  settings: 'settings',
  packageStocks: 'packageStock',
  sales: 'sale',
  saleItems: 'saleItem',
  payments: 'payment',
  lines: 'line',
  linePayments: 'linePayment',
  expenseCategories: 'expenseCategory',
  expenses: 'expense',
  ownerWithdrawals: 'ownerWithdrawal',
  inventoryMovements: 'inventoryMovement',
  cashMovements: 'cashMovement',
  cashClosings: 'cashClosing',
  auditLogs: 'auditLog',
  users: 'user',
};

interface SnapshotFile {
  version: number;
  app: string;
  createdAt: string;
  recordCount: number;
  tables: Record<string, Record<string, unknown>[] | undefined>;
}

@Injectable()
export class BackupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly config: ConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────
  // List
  // ───────────────────────────────────────────────────────────
  async list(): Promise<Backup[]> {
    const rows = await this.prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toBackup(row));
  }

  // ───────────────────────────────────────────────────────────
  // Create — JSON snapshot لكل الجداول + checksum
  // ───────────────────────────────────────────────────────────
  async create(
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<Backup> {
    const backupDir = this.config.getOrThrow<string>('BACKUP_DIR');
    await fs.mkdir(backupDir, { recursive: true });

    // One consistent snapshot, even while financial operations are being written.
    const { tables, recordCount } = await this.prisma.$transaction(async (tx) => {
      const delegates = tx as unknown as Record<string, SnapshotDelegate>;
      const tables: Record<string, Record<string, unknown>[]> = {};
      let recordCount = 0;
      for (const model of INSERT_ORDER) {
        const rows = await delegates[PRISMA_DELEGATES[model]].findMany();
        tables[model] = rows.map((row) => this.serializeRow(model, row));
        recordCount += rows.length;
      }
      const users = await delegates.user.findMany();
      tables.users = users.map((row) => this.serializeRow('users', row));
      recordCount += users.length;
      return { tables, recordCount };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120_000 });

    // ─── 2. كتابة الملف ───
    const snapshot: SnapshotFile = {
      version: SNAPSHOT_VERSION,
      app: 'prince-net',
      createdAt: new Date().toISOString(),
      recordCount,
      tables,
    };

    const fileName = `prince-net-backup-${this.buildTimestamp()}-${crypto.randomUUID()}.json`;
    const buffer = Buffer.from(JSON.stringify(snapshot), 'utf8');
    const storagePath = path.join(backupDir, fileName);
    await fs.writeFile(storagePath, buffer, { mode: 0o600 });

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // ─── 3. تسجيل النسخة + audit داخل transaction واحدة ───
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.backup.create({
        data: {
          fileName,
          storagePath,
          sizeBytes: BigInt(buffer.byteLength),
          recordCount,
          checksum,
          createdBy: userId,
        },
      });

      await this.auditService.logTx(tx, {
        userId,
        action: 'BACKUP_CREATED',
        entityType: 'Backup',
        entityId: row.id,
        newValues: {
          fileName,
          sizeBytes: buffer.byteLength,
          recordCount,
          checksum,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });

      return row;
    });

    return this.toBackup(created);
  }

  // ───────────────────────────────────────────────────────────
  // Download — تصدير ملف النسخة إلى جهاز المستخدم
  // ───────────────────────────────────────────────────────────
  async download(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new NotFoundException({
        message: 'النسخة الاحتياطية غير موجودة',
        code: 'BACKUP_NOT_FOUND',
      });
    }

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(backup.storagePath);
    } catch {
      throw new BusinessException(
        'BACKUP_FILE_MISSING',
        'ملف النسخة الاحتياطية غير موجود على السيرفر',
        410,
      );
    }

    await this.auditService.log({
      userId,
      action: 'BACKUP_EXPORTED',
      entityType: 'Backup',
      entityId: id,
      newValues: { fileName: backup.fileName },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return { buffer, fileName: backup.fileName };
  }

  // ───────────────────────────────────────────────────────────
  // Delete — حذف نسخة واحدة (الملف + السجل معًا)
  // ───────────────────────────────────────────────────────────
  async remove(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean }> {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new NotFoundException({
        message: 'النسخة الاحتياطية غير موجودة',
        code: 'BACKUP_NOT_FOUND',
      });
    }

    // حذف الملف أولًا (force: لا يفشل لو الملف مفقود)
    await fs.rm(backup.storagePath, { force: true });

    await this.prisma.$transaction(async (tx) => {
      await tx.backup.delete({ where: { id } });
      await this.auditService.logTx(tx, {
        userId,
        action: 'BACKUP_DELETED',
        entityType: 'Backup',
        entityId: id,
        oldValues: {
          fileName: backup.fileName,
          recordCount: backup.recordCount,
          checksum: backup.checksum,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });
    });

    return { success: true };
  }

  // ───────────────────────────────────────────────────────────
  // Delete all — حذف جميع النسخ (الملفات + السجلات معًا)
  // ───────────────────────────────────────────────────────────
  async removeAll(
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean; deletedCount: number }> {
    const backups = await this.prisma.backup.findMany({
      select: { id: true, storagePath: true },
    });

    for (const backup of backups) {
      await fs.rm(backup.storagePath, { force: true });
    }

    const deletedCount = await this.prisma.$transaction(async (tx) => {
      const result = await tx.backup.deleteMany({});
      await this.auditService.logTx(tx, {
        userId,
        action: 'BACKUPS_PURGED',
        entityType: 'Backup',
        entityId: null,
        oldValues: { deletedCount: result.count },
        ipAddress: req.ip ?? null,
        userAgent: req.userAgent ?? null,
      });
      return result.count;
    });

    return { success: true, deletedCount };
  }

  // ───────────────────────────────────────────────────────────
  // Restore — التحقق من checksum ثم استبدال البيانات
  // ───────────────────────────────────────────────────────────
  async restore(
    id: string,
    userId: string,
    req: { ip?: string; userAgent?: string },
  ): Promise<{ success: boolean }> {
    // ─── 1. جلب سجل النسخة ───
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new NotFoundException({
        message: 'النسخة الاحتياطية غير موجودة',
        code: 'BACKUP_NOT_FOUND',
      });
    }

    // ─── 2. قراءة الملف + التحقق من السلامة ───
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(backup.storagePath);
    } catch {
      throw new BusinessException(
        'BACKUP_FILE_MISSING',
        'ملف النسخة الاحتياطية غير موجود على السيرفر',
        410,
      );
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    if (checksum !== backup.checksum) {
      throw new BusinessException(
        'BACKUP_CHECKSUM_MISMATCH',
        'فشل التحقق من سلامة ملف النسخة الاحتياطية (checksum غير مطابق)',
        422,
      );
    }

    let snapshot: SnapshotFile;
    try {
      snapshot = JSON.parse(buffer.toString('utf8')) as SnapshotFile;
    } catch {
      throw new BusinessException(
        'BACKUP_INVALID_FORMAT',
        'ملف النسخة الاحتياطية ليس JSON صالحًا',
        422,
      );
    }

    if (![1, SNAPSHOT_VERSION].includes(snapshot.version) || !snapshot.tables) {
      throw new BusinessException(
        'BACKUP_INVALID_FORMAT',
        'صيغة ملف النسخة الاحتياطية غير مدعومة',
        422,
      );
    }

    // ─── 3. استبدال البيانات داخل transaction واحدة ───
    await this.prisma.$transaction(
      async (tx) => {
        const delegates = tx as unknown as Record<
          string,
          SnapshotDelegate & {
            upsert(args: {
              where: { id: string };
              create: Record<string, unknown>;
              update: Record<string, unknown>;
            }): Promise<unknown>;
          }
        >;

        // مسح الجداول — عكس ترتيب الإدراج (الابن قبل الأب)
        for (const model of [...INSERT_ORDER].reverse()) {
          await delegates[PRISMA_DELEGATES[model]].deleteMany();
        }

        // users — دمج بـ upsert: لا يُحذف مستخدم (مرجع FK لـ backups
        // وحساب الجلسة الحالية يجب أن يبقى صالحًا)
        const userRows = snapshot.tables.users ?? [];
        for (const row of userRows) {
          const data = this.deserializeRow('users' as never, row);
          const id = data.id as string;
          await delegates[PRISMA_DELEGATES.users].upsert({
            where: { id },
            create: data,
            update: data,
          });
        }

        // إعادة الإدراج بترتيب التبعيات
        for (const model of INSERT_ORDER) {
          const rows = snapshot.tables[model];
          if (!rows?.length) continue;
          await delegates[PRISMA_DELEGATES[model]].createMany({
            data: rows.map((row) => this.deserializeRow(model, row)),
          });
        }


      },
      { timeout: 120_000 },
    );

    // ─── 4. Audit خارج الـ transaction ───
    // (مستخدم الجلسة قد لا يكون ضمن الـ snapshot — فشل الـ audit
    //  هنا يُسجَّل فقط ولا يُفشل الاستعادة، انظر AuditService.log)
    await this.auditService.log({
      userId,
      action: 'BACKUP_RESTORED',
      entityType: 'Backup',
      entityId: id,
      newValues: {
        fileName: backup.fileName,
        recordCount: snapshot.recordCount,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.userAgent ?? null,
    });

    return { success: true };
  }

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  /**
   * serializeRow — يحوّل صف Prisma إلى قيم JSON:
   * Date → ISO string، Decimal → string، BigInt → string.
   */
  private serializeRow(
    model: SnapshotModel | 'users',
    row: Record<string, unknown>,
  ): Record<string, unknown> {
    const fields = this.modelFields(model);
    const out: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.kind === 'object') continue; // العلاقات تُستعاد من الـ FK نفسه
      const value = row[field.name];
      if (value === undefined) continue;

      if (value === null) {
        out[field.name] = null;
        continue;
      }

      switch (field.type) {
        case 'DateTime':
          out[field.name] = (value as Date).toISOString();
          break;
        case 'Decimal':
          out[field.name] = (value as Prisma.Decimal).toString();
          break;
        case 'BigInt':
          out[field.name] = (value as bigint).toString();
          break;
        default:
          out[field.name] = value;
      }
    }

    return out;
  }

  /**
   * deserializeRow — يحوّل قيم JSON إلى قيم Prisma:
   * ISO string → Date، string → Decimal/BigInt.
   */
  private deserializeRow(
    model: SnapshotModel | 'users',
    row: Record<string, unknown>,
  ): Record<string, unknown> {
    const fields = this.modelFields(model);
    const out: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.kind === 'object') continue;
      const value = row[field.name];
      if (value === undefined) continue;

      if (value === null) {
        out[field.name] = null;
        continue;
      }

      switch (field.type) {
        case 'DateTime':
          out[field.name] = new Date(value as string);
          break;
        case 'Decimal':
          out[field.name] = new Prisma.Decimal(value as string);
          break;
        case 'BigInt':
          out[field.name] = BigInt(value as string);
          break;
        default:
          out[field.name] = value;
      }
    }

    return out;
  }

  private modelFields(model: SnapshotModel | 'users'): {
    name: string;
    kind: string;
    type: string;
  }[] {
    const modelName = model === 'users' ? 'User' : DMMF_MODEL_NAMES[model];
    const modelMeta = Prisma.dmmf.datamodel.models.find(
      (m) => m.name === modelName,
    );
    if (!modelMeta) {
      throw new BusinessException(
        'BACKUP_MODEL_NOT_FOUND',
        `نموذج ${modelName} غير موجود في Prisma DMMF`,
        500,
      );
    }
    return modelMeta.fields.map((field) => ({
      name: field.name,
      kind: field.kind as string,
      type: field.type as string,
    }));
  }

  private buildTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
      `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
    );
  }

  private toBackup(row: {
    id: string;
    fileName: string;
    storagePath: string;
    sizeBytes: bigint;
    recordCount: number;
    checksum: string;
    createdBy: string;
    createdAt: Date;
  }): Backup {
    return {
      id: row.id,
      fileName: row.fileName,
      sizeBytes: Number(row.sizeBytes),
      recordCount: row.recordCount,
      checksum: row.checksum,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
