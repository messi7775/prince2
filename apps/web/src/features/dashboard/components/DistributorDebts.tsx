import type { DashboardDistributorDebt } from '@prince-net/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { Users } from 'lucide-react';
import { formatMoney } from '../../../lib/currency';

interface DistributorDebtsProps {
  data: DashboardDistributorDebt[];
}

export function DistributorDebts({ data }: DistributorDebtsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">أعلى ديون الموزعين</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="لا توجد ديون"
            description="جميع الموزعين مسدَّدون"
            className="border-0 bg-transparent p-4"
          />
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {data.map((d) => (
              <li
                key={d.distributorId}
                className="flex items-center justify-between gap-3"
              >
                <p className="text-sm font-medium truncate min-w-0">
                  {d.distributorName}
                </p>
                <div className="text-sm font-semibold text-destructive num shrink-0">
                  {formatMoney(d.balance)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}