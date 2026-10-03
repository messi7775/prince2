import { AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardLowStockAlert } from '@prince-net/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { Badge } from '../../../components/ui/badge';

interface LowStockAlertsProps {
  data: DashboardLowStockAlert[];
}

export function LowStockAlerts({ data }: LowStockAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          تنبيهات المخزون
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={Package}
            title="لا توجد تنبيهات"
            description="جميع الباقات لديها مخزون كافٍ"
            className="border-0 bg-transparent p-4"
          />
        ) : (
          <ul className="space-y-3">
            {data.map((alert) => (
              <li key={alert.packageId}>
                <Link
                  to={`/inventory/${alert.packageId}`}
                  className="flex items-center justify-between gap-3 rounded-md p-2 -m-2 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium truncate min-w-0">
                    {alert.packageName}
                  </p>
                  <Badge
                    variant={
                      alert.currentStock <= 0 ? 'destructive' : 'warning'
                    }
                  >
                    {alert.currentStock} / {alert.threshold}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}