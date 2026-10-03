import type { PackageEntity } from '@prince-net/types';
import { formatMoney } from '../../../lib/currency';

interface SaleItemPreview {
    packageId: string;
    quantity: number;
}

interface SaleSummaryProps {
    items: SaleItemPreview[];
    packages: PackageEntity[];
    className?: string;
}

export function SaleSummary({ items, packages, className }: SaleSummaryProps) {
    const packageMap = new Map(packages.map((p) => [p.id, p]));

    const total = items.reduce((sum, item) => {
        const pkg = packageMap.get(item.packageId);
        if (!pkg) return sum;
        // ⚠️ للعرض فقط — الحساب الفعلي في Backend
        const price = parseFloat(pkg.price);
        const itemTotal = price * item.quantity;
        return sum + itemTotal;
    }, 0);

    return (
        <div
      className= {`rounded-md border bg-muted/30 p-4 space-y-2 ${className ?? ''}`
}
    >
    <div className="flex items-center justify-between text-sm" >
        <span className="text-muted-foreground" > عدد الباقات: </span>
            < span className = "font-medium" > { items.length } </span>
                </div>
                < div className = "flex items-center justify-between" >
                    <span className="text-sm text-muted-foreground" >
                        الإجمالي التقريبي:
</span>
    < span className = "text-lg font-bold num" >
    { formatMoney(total.toFixed(2)) }
        </span>
        </div>
        < p className = "text-xs text-muted-foreground" >
            الإجمالي النهائي يُحسب في الخادم حسب سعر الشدة من المخزون.
      </p>
                </div>
  );
}