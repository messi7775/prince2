import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from '@prince-net/validation';
import type { Sale } from '@prince-net/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useToast } from '../../../components/ui/use-toast';
import { useCreatePayment } from '../../payments/hooks/useCreatePayment';
import { formatMoney } from '../../../lib/currency';
import { ApiClientError } from '../../../lib/api-client';

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sales: Sale[];
}

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  sales,
}: RegisterPaymentDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreatePayment();
  const [selectedSaleId, setSelectedSaleId] = useState('');

  const activeSalesWithBalance = useMemo(
    () =>
      sales.filter(
        (s) =>
          s.status === 'ACTIVE' &&
          s.remainingAmount &&
          s.remainingAmount !== '0.00' &&
          s.remainingAmount !== '0',
      ),
    [sales],
  );

  const selectedSale = activeSalesWithBalance.find(
    (s) => s.id === selectedSaleId,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: { amount: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: '', notes: '' });
      setSelectedSaleId('');
    }
  }, [open, reset]);

  const onSubmit = async (data: CreatePaymentInput) => {
    if (!selectedSaleId) {
      toast({
        variant: 'destructive',
        title: 'اختر فاتورة',
        description: 'يجب اختيار فاتورة لتسجيل الدفعة',
      });
      return;
    }

    try {
      const cleaned: CreatePaymentInput = {
        amount: data.amount,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };

      await createMutation.mutateAsync({
        saleId: selectedSaleId,
        input: cleaned,
      });

      toast({
        title: 'تمت إضافة الدفعة',
        description: `المبلغ: ${formatMoney(data.amount)}`,
      });

      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل الإضافة',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة</DialogTitle>
          <DialogDescription>
            اختر الفاتورة وأدخل المبلغ المدفوع
          </DialogDescription>
        </DialogHeader>

        {activeSalesWithBalance.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            لا توجد فواتير نشطة بها رصيد متبقي لهذا الموزع
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="sale">الفاتورة</Label>
              <Select
                value={selectedSaleId}
                onValueChange={setSelectedSaleId}
              >
                <SelectTrigger id="sale">
                  <SelectValue placeholder="اختر فاتورة..." />
                </SelectTrigger>
                <SelectContent>
                  {activeSalesWithBalance.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.invoiceNumber} — متبقي:{' '}
                      {formatMoney(s.remainingAmount!)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSale && (
              <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإجمالي:</span>
                  <span className="num">
                    {formatMoney(selectedSale.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المدفوع:</span>
                  <span className="num">
                    {formatMoney(selectedSale.paidAmount ?? '0.00')}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>المتبقي:</span>
                  <span className="num text-destructive">
                    {formatMoney(selectedSale.remainingAmount ?? '0.00')}
                  </span>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              id="register-payment-form"
            >
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ (ر.ي)</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="مثال: 500"
                  {...register('amount')}
                  disabled={createMutation.isPending || !selectedSaleId}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="ملاحظات إضافية..."
                  {...register('notes')}
                  disabled={createMutation.isPending}
                />
              </div>
            </form>
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            إلغاء
          </Button>
          {activeSalesWithBalance.length > 0 && (
            <Button
              type="submit"
              form="register-payment-form"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
