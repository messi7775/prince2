import { ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import type { DashboardRecentTransaction } from '@prince-net/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { cn } from '../../../lib/utils';

interface RecentTransactionsProps {
  data: DashboardRecentTransaction[];
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">آخر الحركات المالية</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={History}
            title="لا توجد حركات"
            description="لم تُسجَّل أي حركات مالية"
            className="border-0 bg-transparent p-4"
          />
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {data.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {tx.direction === 'IN' ? (
                    <ArrowDownCircle className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    'text-sm font-semibold num shrink-0',
                    tx.direction === 'IN'
                      ? 'text-green-600'
                      : 'text-red-600',
                  )}
                >
                  {tx.direction === 'IN' ? '+' : '-'}
                  {formatMoney(tx.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}