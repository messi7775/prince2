import { z } from "zod";

export const createDistributorSchema = z.object({
  name: z.string().trim().min(1, "اسم الموزع مطلوب").max(120),
  phone: z.string().trim().min(3, "رقم الهاتف مطلوب").max(32),
  address: z.string().trim().max(250).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateDistributorSchema = createDistributorSchema.partial();

export type CreateDistributorInput = z.infer<typeof createDistributorSchema>;
export type UpdateDistributorInput = z.infer<typeof updateDistributorSchema>;
