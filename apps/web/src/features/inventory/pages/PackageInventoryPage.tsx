import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Package as PackageIcon, Plus } from 'lucide-react';
import type { PackageStockSummary } from '@prince-net/types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { usePackageInventory } from '../hooks/usePackageInventory';
import { useInventoryMovements } from '../hooks/useInventoryMovements';
import { BatchesTable } from '../components/BatchesTable';
import { MovementsTable } from '../components/MovementsTable';
import { AddInventoryDialog } from '../components/AddInventoryDialog';
import { AdjustInventoryDialog } from '../components/AdjustInventoryDialog';
import { ReturnInventoryDialog } from '../components/ReturnInventoryDialog';
import { EditBatchDialog } from '../components/EditBatchDialog';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useToast } from '../../../components/ui/use-toast';
import { apiClient } from '../../../lib/api-client';
import { ApiClientError } from '../../../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

const MOVEMENTS_LIMIT = 25;

export function PackageInventoryPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [adjustBatch, setAdjustBatch] = useState<PackageStockSummary | null>(
    null,
  );
  const [returnBatch, setReturnBatch] = useState<PackageStockSummary | null>(
    null,
  );
  const [editBatch, setEditBatch] = useState<PackageStockSummary | null>(null);
  const [deleteBatch, setDeleteBatch] = useState<PackageStockSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Queries
  const packageQuery = usePackageInventory(packageId);
  const movementsQuery = useInventoryMovements({
    packageId,
    page,
    limit: MOVEMENTS_LIMIT,
    order: 'desc',
  });

  if (packageQuery.isLoading) {
    return <LoadingState message="جارٍ تحميل المخزون..." />;
  }

  if (packageQuery.isError || !packageQuery.data) {
    return (
      <ErrorState
        title="تعذّر تحميل المخزون"
        message={
          packageQuery.error instanceof Error
            ? packageQuery.error.message
            : 'حدث خطأ'
        }
        onRetry={() => packageQuery.refetch()}
      />
    );
  }

  const pkg = packageQuery.data;
  const movements = movementsQuery.data?.data ?? [];
  const totalPages = movementsQuery.data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
          <Link to="/inventory">
            <ArrowRight className="me-1 h-4 w-4" />
            العودة للمخزون
          </Link>
        </Button>

        <PageHeader
          title={pkg.packageName}
          description={`الرصيد الحالي: ${pkg.currentStock} شدة`}
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              إضافة دفعة
            </Button>
          }
        />
      </div>

      {/* Batches */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <PackageIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">الدفعات (Batches)</h2>
        </div>

        <BatchesTable
          data={pkg.batches}
          onAdjust={(batch) => setAdjustBatch(batch)}
          onReturn={(batch) => setReturnBatch(batch)}
          onEdit={(batch) => setEditBatch(batch)}
          onDelete={(batch) => setDeleteBatch(batch)}
        />
      </section>

      {/* Movements */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">سجل الحركات</h2>

        {movementsQuery.isLoading ? (
          <LoadingState />
        ) : movementsQuery.isError ? (
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
          <>
            <MovementsTable data={movements} />

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      {/* Dialogs */}
      <AddInventoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultPackageId={packageId}
      />

      <AdjustInventoryDialog
        open={!!adjustBatch}
        onOpenChange={(open) => !open && setAdjustBatch(null)}
        batch={adjustBatch}
      />

      <ReturnInventoryDialog
        open={!!returnBatch}
        onOpenChange={(open) => !open && setReturnBatch(null)}
        batch={returnBatch}
      />

      <EditBatchDialog
        open={!!editBatch}
        onOpenChange={(open) => !open && setEditBatch(null)}
        batch={editBatch}
        packageId={packageId}
      />

      <ConfirmDialog
        open={!!deleteBatch}
        onOpenChange={(open) => !open && setDeleteBatch(null)}
        onConfirm={async () => {
          if (!deleteBatch) return;
          setDeleting(true);
          try {
            await apiClient.delete(`/inventory/batches/${deleteBatch.id}`);
            toast({ title: 'تم حذف الدفعة' });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setDeleteBatch(null);
          } catch (err) {
            const message =
              err instanceof ApiClientError ? err.message : 'حدث خطأ';
            toast({
              variant: 'destructive',
              title: 'فشل الحذف',
              description: message,
            });
          } finally {
            setDeleting(false);
          }
        }}
        title="حذف الدفعة"
        description={
          deleteBatch?.currentQuantity === 0
            ? 'سيتم حذف هذه الدفعة نهائيًا. لا يمكن التراجع.'
            : 'لا يمكن حذف دفعة بها كمية متبقية. صفّر الكمية أولاً عبر تعديل الكمية.'
        }
        confirmLabel="حذف"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}