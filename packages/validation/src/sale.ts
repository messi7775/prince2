import { z } from "zod";
import { moneySchema, uuidSchema } from "./common";

export const saleItemInputSchema = z.object({
    packageId: uuidSchema,
    quantity: z.coerce.number().int().positive("الكمية يجب أن تكون موجبة"),
});

export const createSaleSchema = z.object({
    distributorId: uuidSchema,
    items: z
        .array(saleItemInputSchema)
        .min(1, "يجب اختيار باقة واحدة على الأقل"),
    initialPayment: moneySchema
        .optional()
        .nullable()
        .or(z.literal("")),
    notes: z.string().trim().max(500).optional().nullable(),
});

export const cancelSaleSchema = z.object({
    reason: z.string().trim().min(1, "سبب الإلغاء مطلوب").max(500),
});

export const updateSaleSchema = z.object({
    items: z
        .array(saleItemInputSchema)
        .min(1, "يجب اختيار باقة واحدة على الأقل"),
    notes: z.string().trim().max(500).optional().nullable(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;