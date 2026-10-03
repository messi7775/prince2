import { BusinessException } from '../../common/exceptions/business.exception';
import { Prisma } from '../../generated/prisma';

/**
 * FifoAllocation — توزيع كمية على batch محدد.
 */
export interface FifoAllocation {
  packageStockId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
}

/**
 * allocateFifo — يوزّع الكمية المطلوبة على batches الباقة بترتيب FIFO.
 *
 * ⚠️ يجب أن يُستدعى داخل transaction.
 *
 * الترتيب (FIFO):
 *  1. receivedAt ASC
 *  2. createdAt ASC
 *  3. id ASC (كاسر تعادل)
 *
 * الخطوات:
 *  1. قفل كل صفوف package_stocks للباقة المطلوبة بـ SELECT ... FOR UPDATE.
 *     (لا نستخدم FOR UPDATE مع GROUP BY — PostgreSQL لا يسمح بذلك.)
 *  2. حساب current_quantity لكل batch عبر استعلام منفصل (بدون FOR UPDATE).
 *  3. توزيع neededQuantity على batches بالترتيب.
 *  4. إذا المجموع < neededQuantity → INSUFFICIENT_STOCK.
 *
 * النتيجة: قائمة FifoAllocation (batch → qty + unitPrice).
 */
export async function allocateFifo(
  tx: Prisma.TransactionClient,
  packageId: string,
  neededQuantity: number,
): Promise<FifoAllocation[]> {
  if (neededQuantity <= 0) {
    throw new BusinessException(
      'INVALID_QUANTITY',
      'الكمية يجب أن تكون موجبة',
      400,
    );
  }

  // ───────────────────────────────────────────────────────────
  // الخطوة 1 — قفل كل package_stocks لهذه الباقة بترتيب FIFO
  // (استعلام منفصل: لا GROUP BY مع FOR UPDATE)
  // ───────────────────────────────────────────────────────────
  const lockedStocks = await tx.$queryRaw<
    { id: string; unit_price: Prisma.Decimal }[]
  >`
    SELECT id, unit_price
    FROM package_stocks
    WHERE package_id = ${packageId}::uuid
    ORDER BY received_at ASC, created_at ASC, id ASC
    FOR UPDATE
  `;

  if (lockedStocks.length === 0) {
    throw new BusinessException(
      'INSUFFICIENT_STOCK',
      'لا توجد دفعات مخزون لهذه الباقة',
      400,
    );
  }

  // ───────────────────────────────────────────────────────────
  // الخطوة 2 — حساب الرصيد الحالي لكل batch مقفول
  // (بدون FOR UPDATE — للقراءة فقط)
  // ───────────────────────────────────────────────────────────
  const stockIds = lockedStocks.map((s) => s.id);

  const balances = await tx.inventoryMovement.groupBy({
    by: ['packageStockId'],
    where: { packageStockId: { in: stockIds } },
    _sum: { quantityDelta: true },
  });

  const balanceMap = new Map<string, number>();
  for (const b of balances) {
    balanceMap.set(b.packageStockId, b._sum.quantityDelta ?? 0);
  }

  // ───────────────────────────────────────────────────────────
  // الخطوة 3 — توزيع FIFO
  // ───────────────────────────────────────────────────────────
  const allocations: FifoAllocation[] = [];
  let remaining = neededQuantity;

  for (const stock of lockedStocks) {
    if (remaining <= 0) break;

    const currentQty = balanceMap.get(stock.id) ?? 0;
    if (currentQty <= 0) continue;

    const take = Math.min(currentQty, remaining);

    allocations.push({
      packageStockId: stock.id,
      quantity: take,
      unitPrice: stock.unit_price,
    });

    remaining -= take;
  }

  // ───────────────────────────────────────────────────────────
  // الخطوة 4 — التحقق من الكفاية
  // ───────────────────────────────────────────────────────────
  if (remaining > 0) {
    throw new BusinessException(
      'INSUFFICIENT_STOCK',
      `الكمية المتاحة لا تكفي. المطلوب: ${neededQuantity}، المتاح: ${neededQuantity - remaining}`,
      400,
    );
  }

  return allocations;
}