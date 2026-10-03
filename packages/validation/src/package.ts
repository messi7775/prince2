import { z } from "zod";
import { moneySchema } from "./common";

export const createPackageSchema = z.object({
  name: z.string().trim().min(1, "اسم الباقة مطلوب").max(120),
  price: moneySchema,
  dataSizeMb: z.coerce.number().int().min(0),
  hours: z.coerce.number().int().min(0),
  color: z.string().trim().max(32).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updatePackageSchema = createPackageSchema.partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
