import { z } from "zod";

/**
 * المال يُرسل كنص من Frontend.
 * Backend يحوّله إلى Prisma.Decimal قبل الكتابة في DB.
 *
 * moneySchema:
 * - يجب أن يكون أكبر من صفر.
 * - يقبل: "100", "100.5", "100.50"
 * - يرفض: "-100", "0", "0.00", "abc", "100.123", "1,000"
 *
 * normalizeMoneyString:
 * - formatter عام وليس validator.
 * - يقبل الصفر.
 * - لا يستخدم Number() أو parseFloat() أو toFixed().
 * - يعيد دائمًا خانتين عشريتين.
 */
export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "قيمة مالية غير صحيحة")
  .refine((v) => {
    const [intPart = "0", fracPart = ""] = v.split(".");
    const allZero = /^0*$/.test(intPart) && /^0*$/.test(fracPart);
    return !allZero;
  }, "القيمة يجب أن تكون أكبر من صفر");

export function normalizeMoneyString(value: string): string {
  const raw = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("Invalid money value");
  }

  const [integerPart = "0", fractionPart = ""] = raw.split(".");

  return `${integerPart}.${fractionPart.padEnd(2, "0")}`;
}

export const uuidSchema = z.string().uuid("معرّف غير صالح");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
