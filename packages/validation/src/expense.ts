import { z } from "zod";
import { moneySchema, uuidSchema } from "./common";

export const createExpenseSchema = z.object({
  categoryId: uuidSchema,
  description: z.string().trim().min(1, "الوصف مطلوب").max(250),
  amount: moneySchema,
  expenseDate: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const reverseExpenseSchema = z.object({
  reason: z.string().trim().min(1, "سبب العكس مطلوب").max(500),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ReverseExpenseInput = z.infer<typeof reverseExpenseSchema>;
