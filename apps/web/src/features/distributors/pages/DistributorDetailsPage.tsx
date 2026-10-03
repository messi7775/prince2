import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import type { CreateDistributorInput, UpdatePaymentInput } from '@prince-net/validation';
import type { Payment } from '@prince-net/types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Pagination } from '../../../components/ui/pagination';
import { StatCard } from '../../dashboard/components/StatCard';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { useToast } from '../../../components/ui/use-toast';
import { useDistributor } from '../hooks/useDistributor';
import { useDistributorBalance } from '../hooks/useDistributorBalance';
import { useDistributorSales } from '../hooks/useDistributorSales';
import { useDistributorPayments } from '../hooks/useDistributorPayments';
import { useUpdateDistributor } from '../hooks/useUpdateDistributor';
import {
  useActivateDistributor,
  useDeactivateDistributor,
} from '../hooks/useDistributorStatus';
import { DistributorFormDialog } from '../components/DistributorFormDialog';
import { RegisterPaymentDialog } from '../components/RegisterPaymentDialog';
import { EditPaymentDialog } from '../../payments/components/EditPaymentDialog';
import { useUpdatePayment } from '../../payments/hooks/useUpdatePayment';
import { useDeletePayment } from '../../payments/hooks/useDeletePayment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { formatMoney } from '../../../lib/currency';
import { formatDate, formatDateTime } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

const PAGE_LIMIT = 25;

export function DistributorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<boolean | null>(null);
  const [registerPaymentOpen, setRegisterPaymentOpen] = useState(false);
  const [editPaymentTarget, setEditPaymentTarget] =
    useState<Payment | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] =
    useState<Payment | null>(null);
  const [salesPage, setSalesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

  const distributorQuery = useDistributor(id);
  const balanceQuery = useDistributorBalance(id);
  const salesQuery = useDistributorSales({
    id,
    page: salesPage,
    limit: PAGE_LIMIT,
    order: 'desc',
  });
  const paymentsQuery = useDistributorPayments({
    id,
    page: paymentsPage,
    limit: PAGE_LIMIT,
    order: 'desc',
  });
  const updateMutation = useUpdateDistributor();
  const activateMutation = useActivateDistributor();
  const deactivateMutation = useDeactivateDistributor();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();

  if (distributorQuery.isLoading) {
    return <LoadingState message="جارٍ تحميل الموزع..." />;
  }

  if (distributorQuery.isError || !distributorQuery.data) {
    return (
      <ErrorState
        title="تعذّر تحميل الموزع"
        message={
          distributorQuery.error instanceof Error
            ? distributorQuery.error.message
            : 'حدث خطأ'
        }
        onRetry={() => distributorQuery.refetch()}
      />
    );
  }

  const d = distributorQuery.data;
  const isStatusUpdating =
    activateMutation.isPending || deactivateMutation.isPending;

  const handleUpdate = async (input: CreateDistributorInput) => {
    try {
      await updateMutation.mutateAsync({ id: d.id, input });
      toast({ title: 'تم التحديث' });
      setEditOpen(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل التحديث',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  const handleToggleStatus = async () => {
    if (toggleTarget === null) return;
    try {
      if (toggleTarget) {
        await deactivateMutation.mutateAsync(d.id);
        toast({ title: 'تم التعطيل' });
      } else {
        await activateMutation.mutateAsync(d.id);
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

  const handleEditPayment = async (input: UpdatePaymentInput) => {
    if (!editPaymentTarget) return;
    try {
      await updatePaymentMutation.mutateAsync({
        id: editPaymentTarget.id,
        input,
      });
      toast({ title: 'تم تحديث الدفعة' });
      setEditPaymentTarget(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل التحديث',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentTarget) return;
    try {
      await deletePaymentMutation.mutateAsync({
        id: deletePaymentTarget.id,
      });
      toast({ title: 'تم حذف الدفعة' });
      setDeletePaymentTarget(null);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل الحذف',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
          <Link to="/distributors">
            <ArrowRight className="me-1 h-4 w-4" />
            العودة للموزعين
          </Link>
        </Button>

        <PageHeader
          title={d.name}
          description={d.phone}
          actions={
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setEditOpen(true)} className="flex-1 sm:flex-none">
                <Pencil className="me-2 h-4 w-4" />
                تعديل
              </Button>
              <Button
                variant={d.status === 'ACTIVE' ? 'destructive' : 'default'}
                onClick={() => setToggleTarget(d.status === 'ACTIVE')}
                disabled={isStatusUpdating}
                className="flex-1 sm:flex-none"
              >
                {d.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant={d.status === 'ACTIVE' ? 'success' : 'secondary'}>
            {d.status === 'ACTIVE' ? 'مفعّل' : 'معطّل'}
          </Badge>
          {d.address && (
            <span className="text-xs text-muted-foreground">{d.address}</span>
          )}
          <span className="text-xs text-muted-foreground">
            مسجّل في {formatDate(d.registrationDate)}
          </span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="إجمالي المبيعات"
          value={
            balanceQuery.data ? formatMoney(balanceQuery.data.totalSales) : '—'
          }
          icon={ShoppingCart}
        />
        <StatCard
          title="إجمالي التحصيلات"
          value={
            balanceQuery.data
              ? formatMoney(balanceQuery.data.totalPayments)
              : '—'
          }
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="الرصيد المتبقي"
          value={
            balanceQuery.data ? formatMoney(balanceQuery.data.balance) : '—'
          }
          icon={Banknote}
          variant="destructive"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="payments">التحصيلات</TabsTrigger>
        </TabsList>

        {balanceQuery.data && balanceQuery.data.balance !== '0.00' && balanceQuery.data.balance !== '0' && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">
                الرصيد المتبقي على الموزع:{' '}
                <span className="font-bold text-foreground">
                  {formatMoney(balanceQuery.data.balance)}
                </span>
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setRegisterPaymentOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" />
              تسجيل دفعة
            </Button>
          </div>
        )}

        <TabsContent value="sales" className="space-y-4">
          {salesQuery.isLoading ? (
            <LoadingState />
          ) : !salesQuery.data || salesQuery.data.data.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="لا توجد مبيعات"
              description="لم تُسجَّل أي مبيعات لهذا الموزع"
            />
          ) : (
            <>
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead className="hidden sm:table-cell">التاريخ</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead className="hidden sm:table-cell">المتبقي</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesQuery.data.data.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link
                            to={`/sales/${s.id}`}
                            className="hover:underline num font-medium"
                          >
                            {s.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {formatDate(s.saleDate)}
                        </TableCell>
                        <TableCell className="num">
                          {formatMoney(s.totalAmount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell num">
                          {s.remainingAmount
                            ? formatMoney(s.remainingAmount)
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              s.status === 'ACTIVE' ? 'success' : 'destructive'
                            }
                          >
                            {s.status === 'ACTIVE' ? 'نشطة' : 'ملغاة'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {salesQuery.data.meta.totalPages > 1 && (
                <Pagination
                  page={salesPage}
                  totalPages={salesQuery.data.meta.totalPages}
                  onPageChange={setSalesPage}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {paymentsQuery.isLoading ? (
            <LoadingState />
          ) : !paymentsQuery.data || paymentsQuery.data.data.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="لا توجد تحصيلات"
              description="لم تُسجَّل أي دفعات لهذا الموزع"
            />
          ) : (
            <>
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="hidden sm:table-cell">ملاحظات</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsQuery.data.data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm whitespace-normal sm:whitespace-nowrap">
                          {formatDateTime(p.paymentDate)}
                        </TableCell>
                        <TableCell className="num font-medium">
                          {formatMoney(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === 'ACTIVE' ? 'success' : 'secondary'
                            }
                          >
                            {p.status === 'ACTIVE' ? 'نشطة' : 'معكوسة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                          {p.notes ?? '—'}
                        </TableCell>
                        <TableCell>
                          {p.status === 'ACTIVE' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditPaymentTarget(p)}
                                >
                                  <Pencil className="me-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeletePaymentTarget(p)}
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {paymentsQuery.data.meta.totalPages > 1 && (
                <Pagination
                  page={paymentsPage}
                  totalPages={paymentsQuery.data.meta.totalPages}
                  onPageChange={setPaymentsPage}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <DistributorFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        initialData={d}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget ? 'تعطيل الموزع' : 'تفعيل الموزع'}
        description={
          toggleTarget
            ? `سيتم تعطيل "${d.name}" — لن يمكن إنشاء مبيعات جديدة له.`
            : `سيتم تفعيل "${d.name}".`
        }
        confirmLabel={toggleTarget ? 'تعطيل' : 'تفعيل'}
        variant={toggleTarget ? 'destructive' : 'default'}
        isLoading={isStatusUpdating}
      />

      <RegisterPaymentDialog
        open={registerPaymentOpen}
        onOpenChange={setRegisterPaymentOpen}
        sales={salesQuery.data?.data ?? []}
      />

      <EditPaymentDialog
        open={!!editPaymentTarget}
        onOpenChange={(open) => !open && setEditPaymentTarget(null)}
        payment={editPaymentTarget}
        onSubmit={handleEditPayment}
        isSubmitting={updatePaymentMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletePaymentTarget}
        onOpenChange={(open) => !open && setDeletePaymentTarget(null)}
        onConfirm={handleDeletePayment}
        title="حذف الدفعة"
        description="سيتم حذف الدفعة نهائيًا. هل أنت متأكد؟"
        confirmLabel="حذف"
        variant="destructive"
        isLoading={deletePaymentMutation.isPending}
      />
    </div>
  );
}
