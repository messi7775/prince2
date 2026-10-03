import { z } from "zod";
import { moneySchema, uuidSchema } from "./common";

/**
 * Inventory Ledger
 *
 * 1. لا يوجد current_stock مخزّن في قاعدة البيانات.
 *    المخزون يحسب من SUM(inventory_movements.quantity_delta).
 *
 * 2. InventoryMovement مرتبط بـ packageStockId.
 *
 * 3. عند إضافة مخزون:
 *    - نستقبل packageId لتحديد الباقة.
 *    - Backend ينشئ PackageStock جديدًا.
 *    - unitPrice يحفظ في PackageStock.
 *    - ينشئ InventoryMovement مربوطًا بالـ PackageStock الجديد.
 *
 * 4. عند البيع:
 *    - Backend يختار PackageStock وفق سياسة FIFO.
 *
 * 5. عند الإعادة:
 *    - يجب تحديد packageStockId.
 *
 * 6. عند التعديل:
 *    - يجب تحديد packageStockId.
 */

export const addInventorySchema = z.object({
  packageId: uuidSchema,
  quantity: z.coerce.number().int().positive("الكمية يجب أن تكون موجبة"),
  unitPrice: moneySchema,
  description: z.string().trim().max(500).optional().nullable(),
});

export const adjustInventorySchema = z.object({
  packageStockId: uuidSchema,
  quantityDelta: z.coerce
    .number()
    .int()
    .refine((v) => v !== 0, "الفرق يجب ألا يكون صفرًا"),
  description: z.string().trim().min(1, "السبب مطلوب").max(500),
});

export const returnInventorySchema = z.object({
  packageStockId: uuidSchema,
  quantity: z.coerce.number().int().positive("الكمية يجب أن تكون موجبة"),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateBatchSchema = z.object({
  unitPrice: moneySchema.optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type AddInventoryInput = z.infer<typeof addInventorySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type ReturnInventoryInput = z.infer<typeof returnInventorySchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
