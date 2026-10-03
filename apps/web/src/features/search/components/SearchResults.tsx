import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingDown,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type {
  SearchResult,
  SearchResultType,
} from '@prince-net/types';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';

interface SearchResultsProps {
  results: SearchResult[];
}

const GROUP_ORDER: SearchResultType[] = [
  'DISTRIBUTOR',
  'PACKAGE',
  'SALE',
  'LINE',
  'EXPENSE',
];

const TYPE_LABELS: Record<SearchResultType, string> = {
  DISTRIBUTOR: 'الموزعون',
  PACKAGE: 'الباقات',
  SALE: 'المبيعات',
  LINE: 'الخطوط',
  EXPENSE: 'المصروفات',
};

const TYPE_ICONS: Record<SearchResultType, LucideIcon> = {
  DISTRIBUTOR: Users,
  PACKAGE: Package,
  SALE: ShoppingCart,
  LINE: Wifi,
  EXPENSE: TrendingDown,
};

export function SearchResults({ results }: SearchResultsProps) {
  const grouped = new Map<SearchResultType, SearchResult[]>();
  for (const r of results) {
    const list = grouped.get(r.type) ?? [];
    list.push(r);
    grouped.set(r.type, list);
  }

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((type) => {
        const items = grouped.get(type);
        if (!items || items.length === 0) return null;

        const Icon = TYPE_ICONS[type];

        return (
          <section key={type} className="space-y-2">
            <header className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{TYPE_LABELS[type]}</h2>
              <Badge variant="secondary" className="num">
                {items.length}
              </Badge>
            </header>

            <ul className="rounded-md border bg-card divide-y">
              {items.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    to={item.url}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3',
                      'transition-colors hover:bg-accent/50',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
