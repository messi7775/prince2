import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ExpenseCategory } from '@prince-net/types';
import type { CreateExpenseCategoryInput } from '@prince-net/validation';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useToast } from '../../../components/ui/use-toast';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useCreateExpenseCategory } from '../hooks/useCreateExpenseCategory';
import { useUpdateExpenseCategory } from '../hooks/useUpdateExpenseCategory';
import { useDeleteExpenseCategory } from '../hooks/useDeleteExpenseCategory';
import { useActivateExpenseCategory } from '../hooks/useActivateExpenseCategory';
import { useDeactivateExpenseCategory } from '../hooks/useDeactivateExpenseCategory';
import { ExpenseCategoriesTable } from '../components/ExpenseCategoriesTable';
import { ExpenseCategoryFormDialog } from '../components/ExpenseCategoryFormDialog';
import { ApiClientError } from '../../../lib/api-client';

export function ExpenseCategoriesPage() {
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(
    null,
  );
  const [toggleTarget, setToggleTarget] =
    useState<ExpenseCategory | null>(null);

  const { data, isLoading, isError, error, refetch } =
    useExpenseCategories();

  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();
  const activateMutation = useActivateExpenseCategory();
  const deactivateMutation = useDeactivateExpenseCategory();

  const isFormSubmitting =
    createMutation.isPending || updateMutation.isPending;
  const isStatusUpdating =
    activateMutation.isPending || deactivateMutation.isPending;

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditing(category);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateExpenseCategoryInput) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        toast({ title: 'تم التحديث' });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: 'تمت الإضافة' });
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

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.isActive) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="تصنيفات المصروفات"
        description="إدارة تصنيفات المصروفات"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            تصنيف جديد
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState
          title="تعذّر تحميل التصنيفات"
          message={error instanceof Error ? error.message : 'حدث خطأ'}
          onRetry={() => refetch()}
        />
      ) : (
        <ExpenseCategoriesTable
          data={data}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onToggleStatus={setToggleTarget}
          isUpdating={isStatusUpdating}
        />
      )}

      <ExpenseCategoryFormDialog
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
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف التصنيف"
        description={`سيتم حذف "${deleteTarget?.name ?? ''}" نهائيًا. هل أنت متأكد؟`}
        confirmLabel="حذف"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={
          toggleTarget?.isActive ? 'تعطيل التصنيف' : 'تفعيل التصنيف'
        }
        description={
          toggleTarget?.isActive
            ? `سيتم تعطيل "${toggleTarget.name}" — لن يظهر عند إنشاء مصروفات جديدة.`
            : `سيتم تفعيل "${toggleTarget?.name}".`
        }
        confirmLabel={toggleTarget?.isActive ? 'تعطيل' : 'تفعيل'}
        variant={toggleTarget?.isActive ? 'destructive' : 'default'}
        isLoading={isStatusUpdating}
      />
    </div>
  );
}