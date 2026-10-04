import { Link } from 'react-router-dom';
import { ShoppingCart, PackagePlus, Wallet, Receipt } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const actions = [
  { path: '/sales', label: 'إدارة الفواتير', icon: ShoppingCart },
  { path: '/inventory', label: 'إدارة المخزون', icon: PackagePlus },
  { path: '/cash', label: 'حركات وإغلاق الصندوق', icon: Wallet },
  { path: '/expenses', label: 'تسجيل المصروفات', icon: Receipt },
];

export function QuickActions() {
  return <nav aria-label="إجراءات سريعة" className="grid grid-cols-2 gap-2 md:grid-cols-4">
    {actions.map(({ path, label, icon: Icon }) => <Button key={path} asChild variant="outline" className="h-auto whitespace-normal py-3">
      <Link to={path}><Icon className="me-2 h-4 w-4 shrink-0" />{label}</Link>
    </Button>)}
  </nav>;
}
