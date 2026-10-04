import { ActivityTimeline } from '../../../components/activity/ActivityTimeline';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Pencil, Plus, Printer, Share2 } from 'lucide-react';
import type { CreateLineInput } from '@prince-net/validation';
import type { LinePayment } from '@prince-net/types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useToast } from '../../../components/ui/use-toast';
import { useLine } from '../hooks/useLine';
import { useUpdateLine } from '../hooks/useUpdateLine';
import {
  useActivateLine,
  useDeactivateLine,
} from '../hooks/useLineStatus';
import { LineFormDialog } from '../components/LineFormDialog';
import { useLinePayments } from '../../line-payments/hooks/useLinePayments';
import { LinePaymentsTable } from '../../line-payments/components/LinePaymentsTable';
import {
  PaymentsListFilters,
  type PaymentStatusFilter,
  type PaymentOrder,
} from '../../payments/components/PaymentsListFilters';
import { CreateLinePaymentDialog } from '../../line-payments/components/CreateLinePaymentDialog';
import { ReverseLinePaymentDialog } from '../../line-payments/components/ReverseLinePaymentDialog';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';
import { listLinePaymentsByLine } from '../../line-payments/api/listByLine';
import { buildLinePaymentsReceipt, printHTML } from '../../../lib/print';
import { useSharePdf } from '../../../lib/use-share-pdf';
import { ApiClientError } from '../../../lib/api-client';

const PAYMENTS_LIMIT = 25;

export function LineDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { shareReceipt } = useSharePdf();
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [paymentsStatus, setPaymentsStatus] =
    useState<PaymentStatusFilter>('ALL');
  const [paymentsOrder, setPaymentsOrder] = useState<PaymentOrder>('desc');

  const [editOpen, setEditOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<boolean | null>(null);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [reversePaymentTarget, setReversePaymentTarget] =
    useState<LinePayment | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const lineQuery = useLine(id);
  const updateMutation = useUpdateLine();
  const activateMutation = useActivateLine();
  const deactivateMutation = useDeactivateLine();

  const paymentsQuery = useLinePayments({
    lineId: id,
    page: paymentsPage,
    limit: PAYMENTS_LIMIT,
    order: paymentsOrder,
    status: paymentsStatus === 'ALL' ? undefined : paymentsStatus,
  });

  if (lineQuery.isLoading) {
    return <LoadingState message="جارٍ تحميل الخط..." />;
  }

  if (lineQuery.isError || !lineQuery.data) {
    return (
      <ErrorState
        title="تعذّر تحميل الخط"
        message={
          lineQuery.error instanceof Error
            ? lineQuery.error.message
            : 'حدث خطأ'
        }
        onRetry={() => lineQuery.refetch()}
      />
    );
  }

  const line = lineQuery.data;
  const isStatusUpdating =
    activateMutation.isPending || deactivateMutation.isPending;

  const handleUpdate = async (input: CreateLineInput) => {
    try {
      await updateMutation.mutateAsync({ id: line.id, input });
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
        await deactivateMutation.mutateAsync(line.id);
        toast({ title: 'تم التعطيل' });
      } else {
        await activateMutation.mutateAsync(line.id);
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

  const fetchAllPayments = async () => {
    const firstPage = await listLinePaymentsByLine({
      lineId: line.id,
      page: 1,
      limit: 100,
      order: 'asc',
    });

    const payments = [...firstPage.data];
    for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
      const nextPage = await listLinePaymentsByLine({
        lineId: line.id,
        page,
        limit: 100,
        order: 'asc',
      });
      payments.push(...nextPage.data);
    }
    return payments;
  };

  const handlePrintPayments = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const payments = await fetchAllPayments();

      printHTML(
        buildLinePaymentsReceipt({
          lineName: line.name,
          identifier: line.identifier,
          cost: formatMoney(line.cost),
          payments,
        }),
        `دفعات الخط - ${line.name}`,
      );
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'تعذّرت الطباعة',
        description: err instanceof ApiClientError ? err.message : 'تعذّر تحميل سجل الدفعات',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSharePaymentsPdf = async () => {
    if (isSharingPdf) return;
    setIsSharingPdf(true);
    try {
      const payments = await fetchAllPayments();
      await shareReceipt(
        buildLinePaymentsReceipt({
          lineName: line.name,
          identifier: line.identifier,
          cost: formatMoney(line.cost),
          payments,
        }),
        `دفعات-الخط-${line.name}.pdf`,
      );
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'تعذّر إنشاء PDF',
        description:
          err instanceof ApiClientError
            ? err.message
            : 'تعذّر تحميل سجل الدفعات',
      });
    } finally {
      setIsSharingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
          <Link to="/lines">
            <ArrowRight className="me-1 h-4 w-4" />
            العودة للخطوط
          </Link>
        </Button>

        <PageHeader
          title={line.name}
          description={line.provider}
          actions={
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setEditOpen(true)} className="flex-1 sm:flex-none">
                <Pencil className="me-2 h-4 w-4" />
                تعديل
              </Button>
              <Button
                variant={line.status === 'ACTIVE' ? 'destructive' : 'default'}
                onClick={() => setToggleTarget(line.status === 'ACTIVE')}
                disabled={isStatusUpdating}
                className="flex-1 sm:flex-none"
              >
                {line.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant={line.status === 'ACTIVE' ? 'success' : 'secondary'}>
            {line.status === 'ACTIVE' ? 'مفعّل' : 'معطّل'}
          </Badge>
        </div>
      </div>

      {/* Line Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بيانات الخط</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">المزود</dt>
              <dd className="text-sm font-medium mt-1">{line.provider}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">المعرّف</dt>
              <dd className="text-sm font-medium mt-1 num">
                {line.identifier}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">السرعة</dt>
              <dd className="text-sm font-medium mt-1">
                {line.speed ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                التكلفة الشهرية
              </dt>
              <dd className="text-sm font-medium mt-1 num">
                {formatMoney(line.cost)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                تاريخ الاشتراك
              </dt>
              <dd className="text-sm font-medium mt-1">
                {formatDate(line.subscriptionDate)}
              </dd>
            </div>
            {line.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">ملاحظات</dt>
                <dd className="text-sm mt-1 whitespace-pre-wrap">
                  {line.notes}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Line Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">دفعات الخط</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePrintPayments}
              disabled={isPrinting}
            >
              <Printer className="me-2 h-4 w-4" />
              {isPrinting ? 'جارٍ التحضير...' : 'طباعة'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSharePaymentsPdf}
              disabled={isSharingPdf}
            >
              <Share2 className="me-2 h-4 w-4" />
              {isSharingPdf ? 'جارٍ الإنشاء...' : 'مشاركة PDF'}
            </Button>
            <Button
              size="sm"
              onClick={() => setCreatePaymentOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" />
              إضافة دفعة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsQuery.isLoading ? (
            <LoadingState />
          ) : paymentsQuery.isError ? (
            <ErrorState
              title="تعذّر تحميل الدفعات"
              message={
                paymentsQuery.error instanceof Error
                  ? paymentsQuery.error.message
                  : 'حدث خطأ'
              }
              onRetry={() => paymentsQuery.refetch()}
            />
          ) : (
            <>
              <PaymentsListFilters
                status={paymentsStatus}
                onStatusChange={(v) => {
                  setPaymentsStatus(v);
                  setPaymentsPage(1);
                }}
                order={paymentsOrder}
                onOrderChange={(v) => {
                  setPaymentsOrder(v);
                  setPaymentsPage(1);
                }}
              />
              <LinePaymentsTable
                data={paymentsQuery.data?.data ?? []}
                page={paymentsPage}
                totalPages={paymentsQuery.data?.meta.totalPages ?? 0}
                onPageChange={setPaymentsPage}
                onReverse={setReversePaymentTarget}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ActivityTimeline entityType="Line" entityId={line.id} />

      {/* Dialogs */}
      <LineFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        initialData={line}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget ? 'تعطيل الخط' : 'تفعيل الخط'}
        description={
          toggleTarget
            ? `سيتم تعطيل "${line.name}".`
            : `سيتم تفعيل "${line.name}".`
        }
        confirmLabel={toggleTarget ? 'تعطيل' : 'تفعيل'}
        variant={toggleTarget ? 'destructive' : 'default'}
        isLoading={isStatusUpdating}
      />

      <CreateLinePaymentDialog
        open={createPaymentOpen}
        onOpenChange={setCreatePaymentOpen}
        lineId={line.id}
      />

      <ReverseLinePaymentDialog
        open={!!reversePaymentTarget}
        onOpenChange={(open) => !open && setReversePaymentTarget(null)}
        payment={reversePaymentTarget}
        lineId={line.id}
      />
    </div>
  );
}
