import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Distributor } from '@prince-net/types';
import type { CreateDistributorInput } from '@prince-net/validation';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useToast } from '../../../components/ui/use-toast';
import { useDistributors } from '../hooks/useDistributors';
import { useCreateDistributor } from '../hooks/useCreateDistributor';
import { useUpdateDistributor } from '../hooks/useUpdateDistributor';
import {
  useActivateDistributor,
  useDeactivateDistributor,
} from '../hooks/useDistributorStatus';
import { DistributorsTable } from '../components/DistributorsTable';
import { DistributorFormDialog } from '../components/DistributorFormDialog';
import { DistributorsFilters } from '../components/DistributorsFilters';
import { ApiClientError } from '../../../lib/api-client';

const PAGE_LIMIT = 25;
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function DistributorsPage() {
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Distributor | null>(null);

  const { data, isLoading, isError, error, refetch } = useDistributors({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  const createMutation = useCreateDistributor();
  const updateMutation = useUpdateDistributor();
  const activateMutation = useActivateDistributor();
  const deactivateMutation = useDeactivateDistributor();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isStatusUpdating =
    activateMutation.isPending || deactivateMutation.isPending;

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (d: Distributor) => {
    setEditing(d);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateDistributorInput) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الموزع' });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة الموزع بنجاح' });
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

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.status === 'ACTIVE') {
        await deactivateMutation.mutateAsync(toggleTarget.id);
        toast({ title: 'تم التعطيل' });
      } else {
        await activateMutation.mutateAsync(toggleTarget.id);
        toast({ title: 'تم التفعيل' });
      }
      setToggleTarget(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل التغيير',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموزعون"
        description="إدارة موزعي البطاقات"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            موزع جديد
          </Button>
        }
      />

      <DistributorsFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState
          title="تعذّر تحميل الموزعين"
          message={error instanceof Error ? error.message : 'حدث خطأ'}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DistributorsTable
            data={data.data}
            onEdit={handleEdit}
            onToggleStatus={setToggleTarget}
            isUpdating={isStatusUpdating}
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

      <DistributorFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editing}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={
          toggleTarget?.status === 'ACTIVE'
            ? 'تعطيل الموزع'
            : 'تفعيل الموزع'
        }
        description={
          toggleTarget?.status === 'ACTIVE'
            ? `سيتم تعطيل "${toggleTarget.name}" — لن يمكن إنشاء مبيعات جديدة له.`
            : `سيتم تفعيل "${toggleTarget?.name}".`
        }
        confirmLabel={
          toggleTarget?.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'
        }
        variant={toggleTarget?.status === 'ACTIVE' ? 'destructive' : 'default'}
        isLoading={isStatusUpdating}
      />
    </div>
  );
}
