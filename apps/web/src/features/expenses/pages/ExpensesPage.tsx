import { useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import type { Expense } from '@prince-net/types';
import type { CreateExpenseInput } from '@prince-net/validation';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { useToast } from '../../../components/ui/use-toast';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useExpenseCategories } from '../../expense-categories/hooks/useExpenseCategories';
import { ExpenseCategoriesDialog } from '../../expense-categories/components/ExpenseCategoriesDialog';
import { useExpenses } from '../hooks/useExpenses';
import { useCreateExpense } from '../hooks/useCreateExpense';
import { useUpdateExpense } from '../hooks/useUpdateExpense';
import { useDeleteExpense } from '../hooks/useDeleteExpense';
import { ExpensesFilters } from '../components/ExpensesFilters';
import { ExpensesTable } from '../components/ExpensesTable';
import { ExpenseFormDialog } from '../components/ExpenseFormDialog';
import { printHTML, buildExpenseReceipt } from '../../../lib/print';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

const PAGE_LIMIT = 25;
type StatusFilter = 'ALL' | 'ACTIVE' | 'REVERSED';

export function ExpensesPage() {
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const categoriesQuery = useExpenseCategories();

  const { data, isLoading, isError, error, refetch } = useExpenses({
    page,
    limit: PAGE_LIMIT,
    categoryId: categoryId || undefined,
    status: status === 'ALL' ? undefined : status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditing(expense);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: CreateExpenseInput) => {
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

  const handlePrint = (expense: Expense) => {
    const category = (categoriesQuery.data ?? []).find(
      (c) => c.id === expense.categoryId,
    );
    printHTML(
      buildExpenseReceipt({
        date: formatDate(expense.expenseDate),
        category: category?.name ?? '—',
        description: expense.description,
        amount: formatMoney(expense.amount),
        status: expense.status,
        notes: expense.notes,
      }),
      'سند مصروف',
    );
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المصروفات"
        description="إدارة مصروفات الشبكة"
        actions={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setCategoriesOpen(true)} className="flex-1 sm:flex-none">
              <Tags className="me-2 h-4 w-4" />
              التصنيفات
            </Button>
            <Button onClick={handleCreate} className="flex-1 sm:flex-none">
              <Plus className="me-2 h-4 w-4" />
              مصروف جديد
            </Button>
          </div>
        }
      />

      <ExpensesFilters
        categoryId={categoryId}
        onCategoryChange={(v) => {
          setCategoryId(v);
          setPage(1);
        }}
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
          title="تعذّر تحميل المصروفات"
          message={error instanceof Error ? error.message : 'حدث خطأ'}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <ExpensesTable
            data={data.data}
            categories={categoriesQuery.data ?? []}
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

      <ExpenseFormDialog
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
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المصروف"
        description={`سيتم حذف "${deleteTarget?.description ?? ''}" نهائيًا. هل أنت متأكد؟`}
        confirmLabel="حذف"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      <ExpenseCategoriesDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </div>
  );
}
