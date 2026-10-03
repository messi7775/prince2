import { z } from "zod";
import { moneySchema } from "./common";

export const createPaymentSchema = z.object({
    amount: moneySchema,
    notes: z.string().trim().max(500).optional().nullable(),
});

export const reversePaymentSchema = z.object({
    reason: z.string().trim().min(1, "سبب العكس مطلوب").max(500),
});

export const updatePaymentSchema = z.object({
    amount: moneySchema.optional(),
    notes: z.string().trim().max(500).optional().nullable(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;
