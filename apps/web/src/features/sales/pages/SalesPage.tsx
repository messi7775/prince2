import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { SalesFilters } from '../components/SalesFilters';
import { SalesTable } from '../components/SalesTable';
import { SaleFormDialog } from '../components/SaleFormDialog';
import { useSales } from '../hooks/useSales';

const PAGE_LIMIT = 25;
type StatusFilter = 'ALL' | 'ACTIVE' | 'CANCELLED';

export function SalesPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<StatusFilter>('ALL');
    const [distributorId, setDistributorId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const { data, isLoading, isError, error, refetch } = useSales({
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        distributorId: distributorId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const totalPages = data?.meta.totalPages ?? 0;

    return (
        <div className= "space-y-6" >
        <PageHeader
        title="المبيعات"
    description = "إدارة فواتير البيع"
    actions = {
          < Button onClick = {() => setCreateOpen(true)
}>
    <Plus className="me-2 h-4 w-4" />
        فاتورة جديدة
            </Button>
        }
      />

    < SalesFilters
search = { search }
onSearchChange = {(v) => {
    setSearch(v);
    setPage(1);
}}
status = { status }
onStatusChange = {(v) => {
    setStatus(v);
    setPage(1);
}}
distributorId = { distributorId }
onDistributorChange = {(v) => {
    setDistributorId(v);
    setPage(1);
}}
dateFrom = { dateFrom }
onDateFromChange = {(v) => {
    setDateFrom(v);
    setPage(1);
}}
dateTo = { dateTo }
onDateToChange = {(v) => {
    setDateTo(v);
    setPage(1);
}}
      />

{
    isLoading ? (
        <LoadingState />
    ) : isError || !data ? (
        <ErrorState
          title= "تعذّر تحميل المبيعات"
          message = { error instanceof Error ? error.message : 'حدث خطأ' }
    onRetry = {() => refetch()
}
        />
      ) : (
    <>
    <SalesTable data= { data.data } />
    { totalPages > 1 && (
        <Pagination
              page={ page }
totalPages = { totalPages }
onPageChange = { setPage }
    />
          )}
</>
      )}

<SaleFormDialog open={ createOpen } onOpenChange = { setCreateOpen } />
    </div>
  );
}