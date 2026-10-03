import { z } from "zod";

export const updateSettingsSchema = z.object({
    networkName: z.string().trim().min(1).max(120).optional(),
    currencyName: z.string().trim().min(1).max(50).optional(),
    currencySymbol: z.string().trim().min(1).max(10).optional(),
    adminEmail: z.string().trim().toLowerCase().email().optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
