import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CreditCard,
    Pencil,
    Plus,
    Printer,
    Share2,
    ShoppingCart,
    Users,
} from 'lucide-react';
import type { CancelSaleInput, UpdatePaymentInput } from '@prince-net/validation';
import type { Payment } from '@prince-net/types';
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
import { StatCard } from '../../dashboard/components/StatCard';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { useToast } from '../../../components/ui/use-toast';
import { useSale } from '../hooks/useSale';
import { useCancelSale } from '../hooks/useCancelSale';
import { CancelSaleDialog } from '../components/CancelSaleDialog';
import { EditSaleDialog } from '../components/EditSaleDialog';
import { usePayments } from '../../payments/hooks/usePayments';
import { useUpdatePayment } from '../../payments/hooks/useUpdatePayment';
import { PaymentsTable } from '../../payments/components/PaymentsTable';
import {
    PaymentsListFilters,
    type PaymentStatusFilter,
    type PaymentOrder,
} from '../../payments/components/PaymentsListFilters';
import { CreatePaymentDialog } from '../../payments/components/CreatePaymentDialog';
import { EditPaymentDialog } from '../../payments/components/EditPaymentDialog';
import { ReversePaymentDialog } from '../../payments/components/ReversePaymentDialog';
import { printHTML, buildSaleReceipt } from '../../../lib/print';
import { useSharePdf } from '../../../lib/use-share-pdf';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

const PAYMENTS_LIMIT = 25;

export function SaleDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { shareReceipt } = useSharePdf();
    const [isSharingPdf, setIsSharingPdf] = useState(false);

    const [cancelOpen, setCancelOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
    const [editPaymentTarget, setEditPaymentTarget] =
        useState<Payment | null>(null);
    const [reversePaymentTarget, setReversePaymentTarget] =
        useState<Payment | null>(null);
    const [paymentsStatus, setPaymentsStatus] =
        useState<PaymentStatusFilter>('ALL');
    const [paymentsOrder, setPaymentsOrder] =
        useState<PaymentOrder>('desc');

    const saleQuery = useSale(id);
    const cancelMutation = useCancelSale();
    const updatePaymentMutation = useUpdatePayment();

    const paymentsQuery = usePayments({
        saleId: id,
        page: paymentsPage,
        limit: PAYMENTS_LIMIT,
        order: paymentsOrder,
        status: paymentsStatus === 'ALL' ? undefined : paymentsStatus,
    });

    if (saleQuery.isLoading) {
        return <LoadingState message="جارٍ تحميل الفاتورة..." />;
    }

    if (saleQuery.isError || !saleQuery.data) {
        return (
            <ErrorState
        title= "تعذّر تحميل الفاتورة"
        message = {
            saleQuery.error instanceof Error
                ? saleQuery.error.message
                : 'حدث خطأ'
        }
        onRetry = {() => saleQuery.refetch()
    }
      />
    );
}

const sale = saleQuery.data;
const isCancelled = sale.status === 'CANCELLED';
const hasRemaining =
    sale.remainingAmount !== '0.00' && sale.remainingAmount !== '0';

const handleCancel = async (input: CancelSaleInput) => {
    try {
        await cancelMutation.mutateAsync({ id: sale.id, input });
        toast({ title: 'تم إلغاء الفاتورة' });
        setCancelOpen(false);
    } catch (err) {
        toast({
            variant: 'destructive',
            title: 'فشل الإلغاء',
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

const handlePrint = () => {
    printHTML(
        buildSaleReceipt({
            invoiceNumber: sale.invoiceNumber,
            date: formatDateTime(sale.saleDate),
            distributorName: sale.distributorName ?? '—',
            status: sale.status,
            items: sale.items.map((item) => ({
                packageNameSnapshot: item.packageNameSnapshot,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            })),
            totalAmount: sale.totalAmount,
            paidAmount: sale.paidAmount,
            remainingAmount: sale.remainingAmount,
            notes: sale.notes,
        }),
        `فاتورة ${sale.invoiceNumber}`,
    );
};

const handleSharePdf = async () => {
    if (isSharingPdf) return;
    setIsSharingPdf(true);
    try {
        await shareReceipt(
            buildSaleReceipt({
                invoiceNumber: sale.invoiceNumber,
                date: formatDateTime(sale.saleDate),
                distributorName: sale.distributorName ?? '—',
                status: sale.status,
                items: sale.items.map((item) => ({
                    packageNameSnapshot: item.packageNameSnapshot,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                })),
                totalAmount: sale.totalAmount,
                paidAmount: sale.paidAmount,
                remainingAmount: sale.remainingAmount,
                notes: sale.notes,
            }),
            `فاتورة-${sale.invoiceNumber}.pdf`,
        );
    } finally {
        setIsSharingPdf(false);
    }
};

return (
    <div className= "space-y-3 sm:space-y-6" >
    <div>
    <Button variant="ghost" size = "sm" asChild className = "mb-3 -ms-2" >
        <Link to="/sales" >
            <ArrowRight className="me-1 h-4 w-4" />
                العودة للمبيعات
                    </Link>
                    </Button>

                    < PageHeader
title = {`فاتورة ${sale.invoiceNumber}`}
description = { formatDateTime(sale.saleDate) }
actions = {
            < div className = "flex gap-2 flex-wrap" >
    <Button variant="outline" onClick = { handlePrint } size = "sm" className = "flex-1 sm:flex-none" >
        <Printer className="me-2 h-4 w-4" />
            طباعة
            </Button>
    <Button variant="outline" onClick={handleSharePdf} size="sm" className="flex-1 sm:flex-none" disabled={isSharingPdf}>
        <Share2 className="me-2 h-4 w-4" />
            {isSharingPdf ? 'جارٍ الإنشاء...' : 'مشاركة PDF'}
            </Button>
{
    !isCancelled && (
        <Button variant="outline" onClick = {() => setEditOpen(true)
} size = "sm" className = "flex-1 sm:flex-none" >
    <Pencil className="me-2 h-4 w-4" />
        تعديل
        </Button>
              )}
{
    !isCancelled && (
        <Button
                  variant="destructive"
    onClick = {() => setCancelOpen(true)
}
size = "sm"
className = "flex-1 sm:flex-none"
    >
    <AlertTriangle className="me-2 h-4 w-4" />
        إلغاء الفاتورة
            </Button>
              )}
</div>
          }
        />

    < div className = "flex flex-wrap items-center gap-2 mt-2" >
        <Badge variant={ isCancelled ? 'destructive' : 'success' }>
        { isCancelled? 'ملغاة': 'نشطة' }
            </Badge>
{
    sale.cancelledAt && (
        <span className="text-xs text-muted-foreground" >
            أُلغيت في { formatDateTime(sale.cancelledAt) }
    </span>
          )
}
</div>
    </div>

{
    isCancelled && sale.cancellationReason && (
        <Card className="border-destructive/30 bg-destructive/5" >
            <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive" >
                <AlertTriangle className="h-4 w-4" />
                    سبب الإلغاء
                        </CardTitle>
                        </CardHeader>
                        < CardContent >
                        <p className="text-sm" > { sale.cancellationReason } </p>
                            </CardContent>
                            </Card>
      )
}

{/* Financial Cards */ }
<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3" >
    <StatCard
          title="إجمالي الفاتورة"
value = { formatMoney(sale.totalAmount) }
icon = { ShoppingCart }
    />
    <StatCard
          title="المدفوع"
value = { formatMoney(sale.paidAmount) }
icon = { CreditCard }
variant = "success"
    />
    <StatCard
          title="المتبقي"
value = { formatMoney(sale.remainingAmount) }
icon = { Banknote }
variant = { hasRemaining? 'destructive': 'default' }
    />
    </div>

{/* Distributor Info */ }
<Card>
    <CardHeader>
    <CardTitle className="text-base flex items-center gap-2" >
        <Users className="h-4 w-4" />
            الموزع
            </CardTitle>
            </CardHeader>
            < CardContent >
            <Button variant="link" asChild className = "p-0 h-auto" >
                <Link to={ `/distributors/${sale.distributorId}` }>
                    عرض بيانات الموزع
                        </Link>
                        </Button>
                        </CardContent>
                        </Card>

{/* Items */ }
<Card>
    <CardHeader>
    <CardTitle className="text-base" > الباقات </CardTitle>
        </CardHeader>
        < CardContent className = "p-0" >
            <Table>
            <TableHeader>
            <TableRow>
            <TableHead>الباقة </TableHead>
            < TableHead > الكمية </TableHead>
            < TableHead className = "hidden sm:table-cell" > سعر الشدة </TableHead>
                < TableHead > الإجمالي </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
{
    sale.items.map((item) => (
        <TableRow key= { item.id } >
        <TableCell className="font-medium" >
        { item.packageNameSnapshot }
        </TableCell>
    < TableCell className = "num" > { item.quantity } </TableCell>
    < TableCell className = "hidden sm:table-cell num" >
    { formatMoney(item.unitPrice)
}
</TableCell>
    < TableCell className = "num font-medium" >
    { formatMoney(item.totalPrice) }
        </TableCell>
        </TableRow>
              ))}
</TableBody>
    </Table>
    </CardContent>
    </Card>

{/* Payments */ }
<Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0" >
        <CardTitle className="text-base" > الدفعات </CardTitle>
{
    !isCancelled && hasRemaining && (
        <Button
              size="sm"
    onClick = {() => setCreatePaymentOpen(true)
}
            >
    <Plus className="me-2 h-4 w-4" />
        إضافة دفعة
            </Button>
          )}
</CardHeader>
    < CardContent className = "p-0" >
        {
            paymentsQuery.isLoading ? (
                <LoadingState />
            ) : paymentsQuery.isError ? (
                <ErrorState
              title= "تعذّر تحميل الدفعات"
              message={
                paymentsQuery.error instanceof Error
                    ? paymentsQuery.error.message
                    : 'حدث خطأ'
            }
              onRetry={() => paymentsQuery.refetch()
        }
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
                  <PaymentsTable
                      data={paymentsQuery.data?.data ?? []}
                      page={paymentsPage}
                      totalPages={paymentsQuery.data?.meta.totalPages ?? 0}
                      onPageChange={setPaymentsPage}
                      onEdit={setEditPaymentTarget}
                      onReverse={setReversePaymentTarget}
                  />
              </>
          )}
</CardContent>
    </Card>

{/* Notes */ }
{
    sale.notes && (
        <Card>
        <CardHeader>
        <CardTitle className="text-base" > ملاحظات </CardTitle>
            </CardHeader>
            < CardContent >
            <p className="text-sm whitespace-pre-wrap" > { sale.notes } </p>
                </CardContent>
                </Card>
      )
}

{/* Dialogs */ }
<CancelSaleDialog
        open={ cancelOpen }
onOpenChange = { setCancelOpen }
onConfirm = { handleCancel }
invoiceNumber = { sale.invoiceNumber }
isLoading = { cancelMutation.isPending }
    />

    <EditSaleDialog
        open={ editOpen }
onOpenChange = { setEditOpen }
sale = { sale }
    />

    <CreatePaymentDialog
        open={ createPaymentOpen }
onOpenChange = { setCreatePaymentOpen }
saleId = { sale.id }
totalAmount = { sale.totalAmount }
paidAmount = { sale.paidAmount }
remainingAmount = { sale.remainingAmount }
    />

    <EditPaymentDialog
        open={ !!editPaymentTarget }
onOpenChange = {(open) => !open && setEditPaymentTarget(null)}
payment = { editPaymentTarget }
onSubmit = { handleEditPayment }
isSubmitting = { updatePaymentMutation.isPending }
    />

    <ReversePaymentDialog
        open={ !!reversePaymentTarget }
onOpenChange = {(open) => !open && setReversePaymentTarget(null)}
payment = { reversePaymentTarget }
saleId = { sale.id }
    />
    </div>
  );
}
