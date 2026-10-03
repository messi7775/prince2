/**
 * endOfDay — يحوّل "YYYY-MM-DD" إلى ISO string بنهاية اليوم.
 *
 * السبب:
 *  - Backend يستخدم `new Date("YYYY-MM-DD")` = بداية اليوم (00:00:00.000Z).
 *  - عند استخدامه مع `lte`، يُستبعد بقية اليوم.
 *  - الحل: نرسل نهاية اليوم من Frontend (23:59:59.999Z).
 *
 * ⚠️ لا نُعدّل Backend. هذا normalization على مستوى العميل فقط.
 */
export function endOfDay(date: string | undefined): string | undefined {
    if (!date) return undefined;
    return new Date(`${date}T23:59:59.999Z`).toISOString();
}