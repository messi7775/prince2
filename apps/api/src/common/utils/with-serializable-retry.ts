import { Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';

const logger = new Logger('SerializableRetry');

/**
 * withSerializableRetry — يُعيد محاولة تنفيذ عملية عند تعارض Serializable.
 *
 * Prisma error code P2034 = "Transaction failed due to a write conflict
 * or a deadlock. Please retry your transaction."
 *
 * استراتيجية retry:
 *  - الحد الأقصى: 3 محاولات (افتراضيًا).
 *  - تأخير تصاعدي: 50ms, 100ms, 150ms.
 *  - فقط على P2034 (لا على أخطاء أخرى).
 *
 * ⚠️ مهم: كل retry يعيد transaction كاملة من البداية.
 *     لا تعالج أي شيء جزئيًا داخل نفس transaction.
 */
export async function withSerializableRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let attempt = 0;

  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const isSerializationConflict =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2034';

      if (!isSerializationConflict || attempt >= maxRetries) {
        throw err;
      }

      attempt++;
      const delayMs = 50 * attempt;

      logger.warn(
        `Serializable conflict (P2034) — retry ${attempt}/${maxRetries} after ${delayMs}ms`,
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * withInvoiceNumberRetry — يُعيد محاولة transaction كاملة عند
 * UNIQUE violation على `sales.invoice_number` فقط.
 *
 * Prisma error code P2002 = "Unique constraint failed on the fields: ..."
 *
 * شروط إعادة المحاولة:
 *  - err.code === 'P2002'
 *  - err.meta.target يحتوي على 'invoice_number'
 *
 * لا نعيد المحاولة على أي P2002 آخر (مثل name uniqueness).
 */
export async function withInvoiceNumberRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let attempt = 0;

  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (
        !(err instanceof Prisma.PrismaClientKnownRequestError) ||
        err.code !== 'P2002'
      ) {
        throw err;
      }

      const target = err.meta?.target;
      const isInvoiceConflict =
        Array.isArray(target) && target.includes('invoice_number');

      if (!isInvoiceConflict || attempt >= maxRetries) {
        throw err;
      }

      attempt++;
      const delayMs = 50 * attempt;

      logger.warn(
        `Invoice number conflict (P2002) — retry ${attempt}/${maxRetries} after ${delayMs}ms`,
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}