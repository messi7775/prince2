import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reverseLinePaymentSchema,
  type ReverseLinePaymentInput,
} from '@prince-net/validation';
import type { LinePayment } from '@prince-net/types';
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
import { useReverseLinePayment } from '../hooks/useReverseLinePayment';
import { formatMoney } from '../../../lib/currency';
import { formatDateTime } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

interface ReverseLinePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: LinePayment | null;
  lineId: string;
}

export function ReverseLinePaymentDialog({
  open,
  onOpenChange,
  payment,
  lineId,
}: ReverseLinePaymentDialogProps) {
  const { toast } = useToast();
  const mutation = useReverseLinePayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReverseLinePaymentInput>({
    resolver: zodResolver(reverseLinePaymentSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: ReverseLinePaymentInput) => {
    if (!payment) return;

    try {
      await mutation.mutateAsync({
        paymentId: payment.id,
        lineId,
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
          <DialogTitle>عكس دفعة خط</DialogTitle>
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
              <span className="text-muted-foreground">الفترة:</span>
              <span className="num">{payment.period}</span>
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
          id="reverse-line-payment-form"
        >
          <div className="space-y-2">
            <Label htmlFor="lpayReason">سبب العكس</Label>
            <Textarea
              id="lpayReason"
              rows={3}
              placeholder="سبب العكس (مطلوب)"
              autoFocus
              {...register('reason')}
              disabled={mutation.isPending}
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
            disabled={mutation.isPending}
          >
            تراجع
          </Button>
          <Button
            type="submit"
            form="reverse-line-payment-form"
            variant="destructive"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'جارٍ العكس...' : 'تأكيد العكس'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}