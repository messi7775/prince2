import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = 'حدث خطأ',
  message = 'تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى.',
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 sm:p-12 text-center',
        className,
      )}
      role="alert"
    >
      <div className="rounded-full bg-destructive/10 p-3 sm:p-4">
        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="mt-2 flex gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="me-2 h-4 w-4" />
            إعادة المحاولة
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}