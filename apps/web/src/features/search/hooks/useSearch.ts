import { useQuery } from '@tanstack/react-query';
import { search } from '../api/search';

/**
 * useSearch — query بحث.
 *
 * ملاحظة:
 *  - الـ debounce مسؤولية SearchPage.
 *  - هنا فقط نفعّل/نعطّل حسب طول النص.
 */
export function useSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}
