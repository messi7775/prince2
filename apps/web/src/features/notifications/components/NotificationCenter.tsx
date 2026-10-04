import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import type { AppNotification } from '@prince-net/types';
import { Button } from '../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import { formatMoney } from '../../../lib/currency';
import { useNotifications } from '../hooks/useNotifications';

function severityBadgeVariant(
  severity: AppNotification['severity'],
): 'destructive' | 'secondary' | 'warning' {
  if (severity === 'critical') return 'destructive';
  if (severity === 'warning') return 'warning';
  return 'secondary';
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useNotifications();

  const notifications = data?.notifications ?? [];
  const count = data?.count ?? 0;

  const handleOpen = (n: AppNotification) => {
    setOpen(false);
    navigate(n.url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="مركز التنبيهات"
          className="relative"
        >
          {count > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {count > 0 && (
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">التنبيهات</p>
          <p className="text-xs text-muted-foreground">
            {count > 0 ? `${count} تنبيه يحتاج انتباهك` : 'كل شيء تحت السيطرة'}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? <p className="p-4 text-sm">جارٍ تحميل التنبيهات...</p> : isError ? <div className="p-4 text-sm" role="alert">تعذّر تحميل التنبيهات <Button variant="outline" size="sm" onClick={() => refetch()}>إعادة المحاولة</Button></div> : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد تنبيهات حاليًا
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleOpen(n)}
                className="flex w-full items-start gap-3 border-b last:border-0 px-4 py-3 text-start hover:bg-accent transition-colors"
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    n.severity === 'critical'
                      ? 'bg-destructive'
                      : n.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground/40',
                  )}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{n.title}</span>
                    <Badge variant={severityBadgeVariant(n.severity)} className="text-[10px]">
                      {n.severity === 'critical'
                        ? 'حرج'
                        : n.severity === 'warning'
                          ? 'تحذير'
                          : 'معلومة'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.description}
                  </p>
                  {(n.count > 1 || n.amount) && (
                    <p className="text-xs font-medium">
                      {n.count > 1 && `${n.count} عنصر`}
                      {n.count > 1 && n.amount && ' · '}
                      {n.amount && formatMoney(n.amount)}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
