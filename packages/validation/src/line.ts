import { z } from "zod";
import { moneySchema } from "./common";

export const createLineSchema = z.object({
  name: z.string().trim().min(1, "اسم الخط مطلوب").max(120),
  provider: z.string().trim().min(1, "المزود مطلوب").max(120),
  identifier: z.string().trim().min(1, "المعرّف مطلوب").max(120),
  speed: z.string().trim().max(50).optional().nullable(),
  cost: moneySchema,
  subscriptionDate: z.coerce.date(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateLineSchema = createLineSchema.partial();

export type CreateLineInput = z.infer<typeof createLineSchema>;
export type UpdateLineInput = z.infer<typeof updateLineSchema>;
