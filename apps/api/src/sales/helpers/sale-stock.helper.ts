import { Prisma } from '../../generated/prisma';

/** Outstanding allocation after all previous invoice edits/returns.
 * Keep SELL/RETURN history immutable; return only the still-allocated quantity.
 */
export async function outstandingSaleStock(
  tx: Prisma.TransactionClient,
  saleId: string,
) {
  const groups = await tx.inventoryMovement.groupBy({
    by: ['packageStockId', 'unitPrice'],
    where: { referenceType: 'Sale', referenceId: saleId, type: { in: ['SELL', 'RETURN'] } },
    _sum: { quantityDelta: true },
  });
  return groups
    .filter((group) => (group._sum.quantityDelta ?? 0) < 0)
    .map((group) => ({
      packageStockId: group.packageStockId,
      unitPrice: group.unitPrice,
      quantityDelta: group._sum.quantityDelta ?? 0,
    }));
}
