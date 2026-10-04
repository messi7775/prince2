import type { Sale } from '@prince-net/types';
import { Badge } from '../../../components/ui/badge';

/** Payment status is derived, never stored independently from payments. */
export function InvoiceStatusBadge({ sale }: { sale: Sale }) {
  if (sale.status === 'CANCELLED') return <Badge variant="destructive">ملغاة</Badge>;
  if (sale.paidAmount === undefined || sale.remainingAmount === undefined) return <Badge variant="secondary">نشطة</Badge>;
  if (Number(sale.remainingAmount) === 0) return <Badge variant="success">مدفوعة</Badge>;
  if (Number(sale.paidAmount) > 0) return <Badge variant="warning">مدفوعة جزئيًا</Badge>;
  return <Badge variant="secondary">غير مدفوعة</Badge>;
}
