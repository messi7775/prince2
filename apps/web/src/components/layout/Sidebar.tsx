import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  Wifi,
  TrendingDown,
  Wallet,
  Banknote,
  BarChart3,
  Search,
  History,
  Database,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/packages', label: 'الباقات', icon: Package },
  { to: '/inventory', label: 'المخزون', icon: Warehouse },
  { to: '/distributors', label: 'الموزعون', icon: Users },
  { to: '/sales', label: 'المبيعات', icon: ShoppingCart },
  { to: '/lines', label: 'الخطوط', icon: Wifi },
  { to: '/expenses', label: 'المصروفات', icon: TrendingDown },
  { to: '/owner-withdrawals', label: 'سحوبات المالك', icon: Wallet },
  { to: '/cash', label: 'الصندوق', icon: Banknote },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
  { to: '/search', label: 'البحث', icon: Search },
  { to: '/audit-log', label: 'سجل العمليات', icon: History },
  { to: '/backup', label: 'النسخ الاحتياطي', icon: Database },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar() {
  return (
    <nav className="p-2 sm:p-3 space-y-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}