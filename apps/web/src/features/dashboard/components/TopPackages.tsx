import type { DashboardTopPackage } from '@prince-net/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { Package } from 'lucide-react';
import { formatMoney } from '../../../lib/currency';

interface TopPackagesProps {
  data: DashboardTopPackage[];
}

export function TopPackages({ data }: TopPackagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">أفضل الباقات (30 يومًا)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={Package}
            title="لا توجد مبيعات"
            description="لم تُسجَّل أي مبيعات خلال الفترة"
            className="border-0 bg-transparent p-4"
          />
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {data.map((pkg) => (
              <li
                key={pkg.packageId}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {pkg.packageName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pkg.quantity} شدة
                  </p>
                </div>
                <div className="text-sm font-semibold num shrink-0">
                  {formatMoney(pkg.total)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}