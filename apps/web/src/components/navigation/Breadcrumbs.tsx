import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * خريطة المسارات → الأسماء العربية.
 * تُستخدم لعرض Breadcrumbs مشتقة من location.pathname.
 *
 * عند إضافة صفحة جديدة، أضفها هنا فقط.
 */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  packages: 'الباقات',
  inventory: 'المخزون',
  distributors: 'الموزعون',
  sales: 'المبيعات',
  payments: 'التحصيلات',
  lines: 'الخطوط',
  'line-payments': 'دفعات الخطوط',
  expenses: 'المصروفات',
  'expense-categories': 'تصنيفات المصروفات',
  'owner-withdrawals': 'سحوبات المالك',
  cash: 'الصندوق',
  reports: 'التقارير',
  search: 'البحث',
  'audit-log': 'سجل العمليات',
  backup: 'النسخ الاحتياطي',
  settings: 'الإعدادات',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const items: BreadcrumbItem[] = [];
  let accumulatedPath = '';

  segments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;

    // تجاهل UUIDs / IDs (لا نعرضها في breadcrumbs)
    const isProbablyId = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment);
    const label = isProbablyId
      ? 'تفاصيل'
      : (ROUTE_LABELS[segment] ?? segment);

    items.push({
      label,
      href: accumulatedPath,
      isLast: index === segments.length - 1,
    });
  });

  return items;
}

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const location = useLocation();
  const items = buildBreadcrumbs(location.pathname);

  // لا نعرض شيء في الصفحة الرئيسية
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="breadcrumb"
      className={cn('hidden md:flex items-center gap-1 text-sm', className)}
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item) => (
        <div key={item.href} className="flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/60" />
          {item.isLast ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}