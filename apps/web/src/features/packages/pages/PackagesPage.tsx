import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { PackageEntity } from '@prince-net/types';
import type { CreatePackageInput } from '@prince-net/validation';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useToast } from '../../../components/ui/use-toast';
import { usePackages } from '../hooks/usePackages';
import { useCreatePackage } from '../hooks/useCreatePackage';
import { useUpdatePackage } from '../hooks/useUpdatePackage';
import {
  useActivatePackage,
  useDeactivatePackage,
} from '../hooks/usePackageStatus';
import { PackagesFilters } from '../components/PackagesFilters';
import { PackagesTable } from '../components/PackagesTable';
import { PackageFormDialog } from '../components/PackageFormDialog';
import { ApiClientError } from '../../../lib/api-client';

const PAGE_LIMIT = 25;

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function PackagesPage() {
  const { toast } = useToast();

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PackageEntity | null>(null);
  const [toggleTarget, setToggleTarget] = useState<PackageEntity | null>(null);

  // Queries
  const { data, isLoading, isError, error, refetch } = usePackages({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  // Mutations
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const activateMutation = useActivatePackage();
  const deactivateMutation = useDeactivatePackage();

  const isFormSubmitting =
    createMutation.isPending || updateMutation.isPending;

  // Handlers
  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (pkg: PackageEntity) => {
    setEditing(pkg);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreatePackageInput) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        toast({ title: 'تم التحديث', description: 'تم تحديث الباقة بنجاح' });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة الباقة بنجاح' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل الحفظ',
        description: message,
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
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل التغيير',
        description: message,
      });
    }
  };

  const totalPages = data?.meta.totalPages ?? 0;
  const isStatusUpdating =
    activateMutation.isPending || deactivateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الباقات"
        description="إدارة باقات الإنترنت"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            باقة جديدة
          </Button>
        }
      />

      <PackagesFilters
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
          title="تعذّر تحميل الباقات"
          message={
            error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
          }
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <PackagesTable
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

      <PackageFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editing}
        isSubmitting={isFormSubmitting}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={
          toggleTarget?.status === 'ACTIVE'
            ? 'تعطيل الباقة'
            : 'تفعيل الباقة'
        }
        description={
          toggleTarget?.status === 'ACTIVE'
            ? `سيتم تعطيل "${toggleTarget.name}" — لن تظهر للبيع.`
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