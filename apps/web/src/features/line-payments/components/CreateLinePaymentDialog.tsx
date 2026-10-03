import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLinePaymentSchema,
  type CreateLinePaymentInput,
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
import { DatePicker } from '../../../components/ui/date-picker';
import { useToast } from '../../../components/ui/use-toast';
import { useCreateLinePayment } from '../hooks/useCreateLinePayment';
import { formatMoney } from '../../../lib/currency';
import { ApiClientError } from '../../../lib/api-client';

interface CreateLinePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineId: string;
}

export function CreateLinePaymentDialog({
  open,
  onOpenChange,
  lineId,
}: CreateLinePaymentDialogProps) {
  const { toast } = useToast();
  const mutation = useCreateLinePayment();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateLinePaymentInput>({
    resolver: zodResolver(createLinePaymentSchema),
    defaultValues: {
      amount: '',
      paymentDate: new Date(),
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: '',
        paymentDate: new Date(),
        notes: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateLinePaymentInput) => {
    try {
      const cleaned: CreateLinePaymentInput = {
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };

      await mutation.mutateAsync({ lineId, input: cleaned });

      toast({
        title: 'تمت الإضافة',
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
          <DialogTitle>إضافة دفعة خط</DialogTitle>
          <DialogDescription>
            سجّل دفعة شهرية لهذا الخط
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="create-line-payment-form"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lpayAmount">المبلغ (ر.ي)</Label>
              <Input
                id="lpayAmount"
                type="text"
                inputMode="decimal"
                placeholder="مثال: 5,000"
                autoFocus
                {...register('amount')}
                disabled={mutation.isPending}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lpayDate">التاريخ</Label>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date ?? new Date())}
                    disabled={mutation.isPending}
                  />
                )}
              />
              {errors.paymentDate && (
                <p className="text-xs text-destructive">
                  {errors.paymentDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lpayNotes">ملاحظات (اختياري)</Label>
            <Textarea
              id="lpayNotes"
              rows={3}
              placeholder="ملاحظات إضافية..."
              {...register('notes')}
              disabled={mutation.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="create-line-payment-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'جارٍ الإضافة...' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}