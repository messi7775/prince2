import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from '@prince-net/validation';
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
import { useToast } from '../../../components/ui/use-toast';
import { useCreatePayment } from '../hooks/useCreatePayment';
import { formatMoney } from '../../../lib/currency';
import { ApiClientError } from '../../../lib/api-client';

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
}

export function CreatePaymentDialog({
  open,
  onOpenChange,
  saleId,
  totalAmount,
  paidAmount,
  remainingAmount,
}: CreatePaymentDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreatePayment();

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
    }
  }, [open, reset]);

  const onSubmit = async (data: CreatePaymentInput) => {
    try {
      const cleaned: CreatePaymentInput = {
        amount: data.amount,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };

      await createMutation.mutateAsync({
        saleId,
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
          <DialogTitle>إضافة دفعة</DialogTitle>
          <DialogDescription>
            أدخل المبلغ المدفوع — لا يمكن تجاوز المبلغ المتبقي
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الإجمالي:</span>
            <span className="num">{formatMoney(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المدفوع:</span>
            <span className="num">{formatMoney(paidAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>المتبقي:</span>
            <span className="num text-destructive">
              {formatMoney(remainingAmount)}
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="create-payment-form"
        >
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (ر.ي)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="مثال: 500"
              autoFocus
              {...register('amount')}
              disabled={createMutation.isPending}
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
              rows={3}
              placeholder="ملاحظات إضافية..."
              {...register('notes')}
              disabled={createMutation.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="create-payment-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}