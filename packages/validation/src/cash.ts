import { z } from "zod";
import { moneySchema } from "./common";

export const manualCashInSchema = z.object({
    amount: moneySchema,
    description: z.string().trim().min(1, "الوصف مطلوب").max(250),
    movementDate: z.coerce.date().optional(),
});

export const manualCashOutSchema = z.object({
    amount: moneySchema,
    description: z.string().trim().min(1, "الوصف مطلوب").max(250),
    movementDate: z.coerce.date().optional(),
});

export type ManualCashInInput = z.infer<typeof manualCashInSchema>;
export type ManualCashOutInput = z.infer<typeof manualCashOutSchema>;

/* ─── إغلاق الصندوق اليومي ───
   actualBalance: الرصيد الفعلي المعدود في الصندوق.
   expectedBalance يُحسب على السيرفر من cash_movements. */
export const createCashClosingSchema = z.object({
    closingDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الإغلاق غير صالح"),
    actualBalance: moneySchema,
    notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateCashClosingInput = z.infer<typeof createCashClosingSchema>;
