import { z } from "zod";

export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(1, "اسم التصنيف مطلوب").max(120),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateExpenseCategorySchema =
  createExpenseCategorySchema.partial();

export type CreateExpenseCategoryInput = z.infer<
  typeof createExpenseCategorySchema
>;
export type UpdateExpenseCategoryInput = z.infer<
  typeof updateExpenseCategorySchema
>;
