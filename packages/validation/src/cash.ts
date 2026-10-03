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
