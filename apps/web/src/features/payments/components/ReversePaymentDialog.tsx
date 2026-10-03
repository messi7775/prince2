import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reversePaymentSchema,
  type ReversePaymentInput,
} from '@prince-net/validation';
import type { Payment } from '@prince-net/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/use-toast';
import { useReversePayment } from '../hooks/useReversePayment';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

interface ReversePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  saleId: string;
}

export function ReversePaymentDialog({
  open,
  onOpenChange,
  payment,
  saleId,
}: ReversePaymentDialogProps) {
  const { toast } = useToast();
  const reverseMutation = useReversePayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReversePaymentInput>({
    resolver: zodResolver(reversePaymentSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: ReversePaymentInput) => {
    if (!payment) return;

    try {
      await reverseMutation.mutateAsync({
        paymentId: payment.id,
        saleId,
        input: data,
      });

      toast({
        title: 'تم عكس الدفعة',
        description: `المبلغ: ${formatMoney(payment.amount)}`,
      });

      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل العكس',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>عكس دفعة</DialogTitle>
          <DialogDescription>
            سيتم عكس الدفعة وإنشاء حركة نقدية معاكسة. لا يمكن التراجع.
          </DialogDescription>
        </DialogHeader>

        {payment && (
          <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ:</span>
              <span className="num font-semibold">
                {formatMoney(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التاريخ:</span>
              <span className="num text-xs">
                {formatDateTime(payment.paymentDate)}
              </span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="reverse-payment-form"
        >
          <div className="space-y-2">
            <Label htmlFor="reason">سبب العكس</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="سبب العكس (مطلوب)"
              autoFocus
              {...register('reason')}
              disabled={reverseMutation.isPending}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reverseMutation.isPending}
          >
            تراجع
          </Button>
          <Button
            type="submit"
            form="reverse-payment-form"
            variant="destructive"
            disabled={reverseMutation.isPending}
          >
            {reverseMutation.isPending ? 'جارٍ العكس...' : 'تأكيد العكس'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}