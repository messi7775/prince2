import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { OwnerWithdrawal } from '@prince-net/types';
import type { CreateOwnerWithdrawalInput } from '@prince-net/validation';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { useToast } from '../../../components/ui/use-toast';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useOwnerWithdrawals } from '../hooks/useOwnerWithdrawals';
import { useCreateOwnerWithdrawal } from '../hooks/useCreateOwnerWithdrawal';
import { useUpdateOwnerWithdrawal } from '../hooks/useUpdateOwnerWithdrawal';
import { useDeleteOwnerWithdrawal } from '../hooks/useDeleteOwnerWithdrawal';
import { OwnerWithdrawalsFilters } from '../components/OwnerWithdrawalsFilters';
import { OwnerWithdrawalsTable } from '../components/OwnerWithdrawalsTable';
import { OwnerWithdrawalFormDialog } from '../components/OwnerWithdrawalFormDialog';
import { printHTML, buildWithdrawalReceipt } from '../../../lib/print';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

const PAGE_LIMIT = 25;
type StatusFilter = 'ALL' | 'ACTIVE' | 'REVERSED';

export function OwnerWithdrawalsPage() {
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerWithdrawal | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<OwnerWithdrawal | null>(null);

  const { data, isLoading, isError, error, refetch } = useOwnerWithdrawals({
    page,
    limit: PAGE_LIMIT,
    status: status === 'ALL' ? undefined : status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const createMutation = useCreateOwnerWithdrawal();
  const updateMutation = useUpdateOwnerWithdrawal();
  const deleteMutation = useDeleteOwnerWithdrawal();
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (w: OwnerWithdrawal) => {
    setEditing(w);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateOwnerWithdrawalInput) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        toast({ title: 'تم التحديث' });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: 'تم تسجيل السحب' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل الحفظ',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'تم الحذف' });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل الحذف',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  const handlePrint = (w: OwnerWithdrawal) => {
    printHTML(
      buildWithdrawalReceipt({
        date: formatDate(w.withdrawalDate),
        reason: w.reason,
        amount: formatMoney(w.amount),
        status: w.status,
        notes: w.notes,
      }),
      'سند سحب',
    );
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="سحوبات المالك"
        description="سجل سحوبات المالك من الصندوق"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            سحب جديد
          </Button>
        }
      />

      <OwnerWithdrawalsFilters
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
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

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState
          title="تعذّر تحميل السحوبات"
          message={error instanceof Error ? error.message : 'حدث خطأ'}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <OwnerWithdrawalsTable
            data={data.data}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onPrint={handlePrint}
          />
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <OwnerWithdrawalFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف السحب"
        description={`سيتم حذف سحب "${deleteTarget?.reason ?? ''}" نهائيًا. هل أنت متأكد؟`}
        confirmLabel="حذف"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
