import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Package } from 'lucide-react';
import { useLowStockAlerts } from '../../features/inventory/hooks/useLowStockAlerts';
import { Badge } from '../ui/badge';

const DISMISS_KEY = 'low-stock-dismissed-at';
const DISMISS_TTL = 5 * 60 * 1000; // 5 minutes

export function LowStockBanner() {
  const { data } = useLowStockAlerts();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal when new alerts appear after TTL
  useEffect(() => {
    if (!data || data.length === 0) return;
    const dismissedAt = sessionStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_TTL) {
        setDismissed(true);
      } else {
        sessionStorage.removeItem(DISMISS_KEY);
        setDismissed(false);
      }
    }
  }, [data]);

  if (!data || data.length === 0 || dismissed) return null;

  const outOfStock = data.filter((a) => a.currentStock <= 0);
  const lowStock = data.filter((a) => a.currentStock > 0);

  return (
    <div
      data-print-exclude
      className="mx-4 mt-4 lg:mx-6 lg:mt-6 rounded-lg border border-yellow-300/60 bg-yellow-50 dark:bg-yellow-950/40 dark:border-yellow-700/50 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              تنبيه المخزون المنخفض
            </p>
            <Badge variant="warning">{data.length} باقة</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map((alert) => (
              <Link
                key={alert.packageId}
                to={`/inventory/${alert.packageId}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <Package className="h-3 w-3" />
                {alert.packageName}
                <span className="font-bold">({alert.currentStock})</span>
              </Link>
            ))}
            {lowStock.map((alert) => (
              <Link
                key={alert.packageId}
                to={`/inventory/${alert.packageId}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              >
                <Package className="h-3 w-3" />
                {alert.packageName}
                <span className="font-bold">({alert.currentStock})</span>
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
            setDismissed(true);
          }}
          className="shrink-0 rounded-md p-1 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
          aria-label="إخفاء التنبيه"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
