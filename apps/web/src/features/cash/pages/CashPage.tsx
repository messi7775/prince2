import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { CashSourceType } from '@prince-net/types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { StatCard } from '../../dashboard/components/StatCard';
import { CashMovementsFilters } from '../components/CashMovementsFilters';
import { CashMovementsTable } from '../components/CashMovementsTable';
import { ManualCashInDialog } from '../components/ManualCashInDialog';
import { ManualCashOutDialog } from '../components/ManualCashOutDialog';
import { useCashBalance } from '../hooks/useCashBalance';
import { useCashMovements } from '../hooks/useCashMovements';
import { formatMoney } from '../../../lib/currency';

const PAGE_LIMIT = 25;

export function CashPage() {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [sourceType, setSourceType] = useState<CashSourceType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [manualInOpen, setManualInOpen] = useState(false);
  const [manualOutOpen, setManualOutOpen] = useState(false);

  const balanceQuery = useCashBalance();
  const movementsQuery = useCashMovements({
    page,
    limit: PAGE_LIMIT,
    order: 'desc',
    direction: direction === 'ALL' ? undefined : direction,
    sourceType: sourceType === 'ALL' ? undefined : sourceType,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="الصندوق"
        description="إدارة حركة النقد"
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={() => setManualInOpen(true)} className="flex-1 sm:flex-none">
              <ArrowDownCircle className="me-2 h-4 w-4" />
              إيداع يدوي
            </Button>
            <Button
              variant="outline"
              onClick={() => setManualOutOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <ArrowUpCircle className="me-2 h-4 w-4" />
              سحب يدوي
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {balanceQuery.isLoading ? (
        <LoadingState />
      ) : balanceQuery.isError || !balanceQuery.data ? (
        <ErrorState
          title="تعذّر تحميل الرصيد"
          message={
            balanceQuery.error instanceof Error
              ? balanceQuery.error.message
              : 'حدث خطأ'
          }
          onRetry={() => balanceQuery.refetch()}
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            title="الرصيد الحالي"
            value={formatMoney(balanceQuery.data.balance)}
            icon={Wallet}
          />
          <StatCard
            title="إجمالي الداخل"
            value={formatMoney(balanceQuery.data.totalIn)}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="إجمالي الخارج"
            value={formatMoney(balanceQuery.data.totalOut)}
            icon={TrendingDown}
            variant="destructive"
          />
        </div>
      )}

      {/* Filters */}
      <CashMovementsFilters
        direction={direction}
        onDirectionChange={(v) => {
          setDirection(v);
          setPage(1);
        }}
        sourceType={sourceType}
        onSourceTypeChange={(v) => {
          setSourceType(v);
          setPage(1);
        }}
        dateFrom={dateFrom}
        onDateFromChange={(v) => {
          setDateFrom(v);
          setPage(1);
        }}
        dateTo={dateTo}
        onDateToChange={(v) => {
          setDateTo(v);
          setPage(1);
        }}
      />

      {/* Movements */}
      {movementsQuery.isLoading ? (
        <LoadingState />
      ) : movementsQuery.isError || !movementsQuery.data ? (
        <ErrorState
          title="تعذّر تحميل الحركات"
          message={
            movementsQuery.error instanceof Error
              ? movementsQuery.error.message
              : 'حدث خطأ'
          }
          onRetry={() => movementsQuery.refetch()}
        />
      ) : (
        <CashMovementsTable
          data={movementsQuery.data.data}
          page={page}
          totalPages={movementsQuery.data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Dialogs */}
      <ManualCashInDialog
        open={manualInOpen}
        onOpenChange={setManualInOpen}
      />
      <ManualCashOutDialog
        open={manualOutOpen}
        onOpenChange={setManualOutOpen}
      />
    </div>
  );
}