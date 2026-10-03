import type { Prisma } from '../../generated/prisma';

/**
 * generateInvoiceNumber — يولّد رقم فاتورة فريد بصيغة INV-YYYYMM-XXXX.
 *
 * ⚠️ يجب أن يُستدعى داخل transaction.
 *
 * آلية التوليد:
 *  - البادئة: `INV-YYYYMM-` (مثال: INV-202609-)
 *  - التسلسل: `MAX(sequence) + 1` داخل نفس الشهر.
 *  - يُنسّق بـ 4 خانات (0001, 0002, ...).
 *
 * ملاحظة:
 *  - قد يحدث UNIQUE violation (P2002) عند تزامن الطلبات.
 *  - الحل: `withInvoiceNumberRetry` يعيد transaction كاملة،
 *    فيُعاد حساب MAX + 1 برقم جديد.
 */
export async function generateInvoiceNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}-`;

  const result = await tx.$queryRaw<{ next_seq: number }[]>`
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(invoice_number FROM 'INV-\\d{6}-(\\d+)')
          AS INTEGER
        )
      ),
      0
    ) + 1 AS next_seq
    FROM sales
    WHERE invoice_number LIKE ${prefix + '%'}
  `;

  const nextSeq = result[0]?.next_seq ?? 1;
  const paddedSeq = String(nextSeq).padStart(4, '0');

  return `${prefix}${paddedSeq}`;
}