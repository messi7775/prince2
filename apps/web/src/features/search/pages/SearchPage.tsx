import { useEffect, useState } from 'react';
import { Search as SearchIcon, SearchX } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { EmptyState } from '../../../components/ui/empty-state';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const trimmedDebounced = debouncedQuery.trim();
  const canSearch = trimmedDebounced.length >= MIN_QUERY_LENGTH;

  const { data, isLoading, isError, error, refetch } = useSearch(
    debouncedQuery,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="البحث"
        description="بحث شامل في الموزعين، الباقات، الفواتير، الخطوط، والمصروفات"
      />

      <SearchInput value={query} onChange={setQuery} />

      {!canSearch ? (
        <EmptyState
          icon={SearchIcon}
          title="ابدأ الكتابة"
          description={`أدخل ${MIN_QUERY_LENGTH} أحرف على الأقل للبحث`}
        />
      ) : isLoading ? (
        <LoadingState message="جارٍ البحث..." />
      ) : isError ? (
        <ErrorState
          title="تعذّر إجراء البحث"
          message={error instanceof Error ? error.message : 'حدث خطأ'}
          onRetry={() => refetch()}
        />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="لا توجد نتائج"
          description={`لم نجد أي نتائج مطابقة لـ "${trimmedDebounced}"`}
        />
      ) : (
        <SearchResults results={data.results} />
      )}
    </div>
  );
}
