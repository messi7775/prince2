import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, Package, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { Badge } from '../../../components/ui/badge';
import { AddInventoryDialog } from '../components/AddInventoryDialog';
import { useInventoryOverview } from '../hooks/useInventoryOverview';

export function InventoryPage() {
  const { data, isLoading, isError, error, refetch } = useInventoryOverview();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="المخزون"
        description="إدارة دفعات المخزون لكل باقة"
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            إضافة دفعة
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState
          title="تعذّر تحميل المخزون"
          message={error instanceof Error ? error.message : 'حدث خطأ'}
          onRetry={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="لا توجد بيانات"
          description="ابدأ بإضافة باقة أولاً"
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((row) => (
            <Link
              key={row.packageId}
              to={`/inventory/${row.packageId}`}
              className="group block rounded-lg border bg-card p-4 sm:p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">
                      {row.packageName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      عرض الدفعات والحركات
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    row.currentStock <= 0
                      ? 'destructive'
                      : row.currentStock <= 10
                        ? 'warning'
                        : 'success'
                  }
                >
                  {row.currentStock}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AddInventoryDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}