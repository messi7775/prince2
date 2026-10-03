import type { MoneyString } from '@prince-net/types';

/**
 * ═══════════════════════════════════════════════════════════════
 * currency — Display helpers for MoneyString.
 * ═══════════════════════════════════════════════════════════════
 *
 * قواعد صارمة:
 *  - MoneyString يبقى string حتى طبقة العرض.
 *  - لا Number() ولا parseFloat() ولا toFixed() إطلاقًا.
 *  - التنسيق يتم بالكامل عبر string manipulation.
 *  - العمليات المالية تجري في Backend فقط.
 *
 * أمثلة:
 *   formatMoney("1250.50")           → "1,250"
 *   formatMoney("1250.50", "ر.ي")    → "1,250 ر.ي"
 *   formatMoney("0.00")              → "0"
 *   formatMoney("1000000.00")        → "1,000,000"
 *   formatMoney("3000")              → "3,000"
 *   formatMoney("5000")              → "5,000"
 */

/**
 * يضيف فواصل الآلاف إلى الجزء الصحيح من رقم نصي.
 *
 * أمثلة:
 *   addThousandsSeparator("1234")     → "1,234"
 *   addThousandsSeparator("1234567")  → "1,234,567"
 *   addThousandsSeparator("100")      → "100"
 *   addThousandsSeparator("0")        → "0"
 */
function addThousandsSeparator(integerPart: string): string {
  if (integerPart.length <= 3) return integerPart;

  const chunks: string[] = [];
  let remaining = integerPart;

  while (remaining.length > 3) {
    chunks.unshift(remaining.slice(-3));
    remaining = remaining.slice(0, -3);
  }

  chunks.unshift(remaining);

  return chunks.join(',');
}

/**
 * يُنسّق MoneyString للعرض.
 *
 * - يفترض أن MoneyString يأتي دائمًا بصيغة صحيحة من Backend.
 * - إن كان فارغًا أو غير صالح، يعيد "—".
 * - التنفيذ بالكامل نصي — لا تحويل رقمي.
 * - يتم إخفاء الجزء الكسري عند العرض.
 *
 * أمثلة:
 *   formatMoney("3000")       → "3,000"
 *   formatMoney("3000.00")   → "3,000"
 *   formatMoney("5000")       → "5,000"
 *   formatMoney("1250.50")   → "1,250"
 *   formatMoney("1000000.00") → "1,000,000"
 */
export function formatMoney(
  value: MoneyString | null | undefined,
  symbol?: string,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const parts = value.split('.');
  const rawInteger = parts[0] ?? '0';

  // إزالة الأصفار البادئة بدون تحويل رقمي
  const integerPart = rawInteger.replace(/^0+(?=\d)/, '');

  // فواصل الآلاف على الجزء الصحيح
  const formattedInteger = addThousandsSeparator(integerPart);

  const display = formattedInteger;

  return symbol ? `${display} ${symbol}` : display;
}

/**
 * يُنسّق MoneyString بدون فواصل الآلاف.
 *
 * مناسب للطباعة المدمجة أو حقول الإدخال.
 *
 * أمثلة:
 *   formatMoneyCompact("3000.00") → "3000.00"
 *   formatMoneyCompact("5000.00") → "5000.00"
 */
export function formatMoneyCompact(
  value: MoneyString | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return value;
}