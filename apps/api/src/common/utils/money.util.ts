import { Prisma } from '../../generated/prisma';
import type { MoneyString } from '@prince-net/types';

/**
 * ═══════════════════════════════════════════════════════════════
 * money.util — MoneyString ↔ Prisma.Decimal conversions.
 * ═══════════════════════════════════════════════════════════════
 *
 * قواعد صارمة:
 *  - لا Number() ولا parseFloat() ولا JS Number.toFixed().
 *  - لا مرور عبر JavaScript floating-point.
 *  - Prisma.Decimal يستخدم decimal.js داخليًا (دقة تعسفية).
 *
 * ⚠️ ملاحظة مهمة:
 *   Prisma.Decimal.toFixed() ≠ Number.prototype.toFixed().
 *   الأولى تعمل على decimal.js بكامل الدقة.
 *   الثانية تعمل على double (IEEE 754) وقد تفقد الدقة.
 *
 *   نستخدم فقط Prisma.Decimal.toFixed().
 */

/**
 * MoneyString → Prisma.Decimal.
 * Prisma.Decimal يقبل string مباشرة — لا تحويل رقمي.
 */
export function toDecimal(
  value: MoneyString | null | undefined,
): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(value);
}

/**
 * MoneyString → Prisma.Decimal (إلزامي — يرمي على null/undefined).
 * يُستخدم في الحقول المالية الإلزامية.
 */
export function toDecimalRequired(value: MoneyString): Prisma.Decimal {
  if (value === null || value === undefined || value === '') {
    throw new Error('toDecimalRequired: value is required');
  }
  return new Prisma.Decimal(value);
}

/**
 * Prisma.Decimal → MoneyString.
 * - يستخدم Prisma.Decimal.toFixed(2) من decimal.js.
 * - لا يمر عبر JavaScript number.
 */
export function toMoneyString(
  value: Prisma.Decimal | null | undefined,
): MoneyString | null {
  if (value === null || value === undefined) return null;
  return value.toFixed(2);
}

/**
 * Prisma.Decimal → MoneyString (إلزامي — يرمي على null/undefined).
 */
export function toMoneyStringRequired(value: Prisma.Decimal): MoneyString {
  if (value === null || value === undefined) {
    throw new Error('toMoneyStringRequired: value is required');
  }
  return value.toFixed(2);
}

/**
 * جمع قيم Decimal بأمان (للاستخدام داخل Backend فقط).
 */
export function sumDecimals(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce(
    (acc, v) => acc.plus(v),
    new Prisma.Decimal(0),
  );
}

/**
 * طرح قيم Decimal بأمان.
 */
export function subtractDecimals(
  a: Prisma.Decimal,
  b: Prisma.Decimal,
): Prisma.Decimal {
  return a.minus(b);
}
