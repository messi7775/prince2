import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updatePaymentSchema,
  type UpdatePaymentInput,
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
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSubmit: (input: UpdatePaymentInput) => Promise<void>;
  isSubmitting: boolean;
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSubmit,
  isSubmitting,
}: EditPaymentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePaymentInput>({
    resolver: zodResolver(updatePaymentSchema),
    defaultValues: { amount: '', notes: '' },
  });

  useEffect(() => {
    if (open && payment) {
      reset({
        amount: payment.amount,
        notes: payment.notes ?? '',
      });
    }
  }, [open, payment, reset]);

  const handleFormSubmit = async (data: UpdatePaymentInput) => {
    const cleaned: UpdatePaymentInput = {
      amount: data.amount || undefined,
      notes: data.notes?.trim() ? data.notes.trim() : null,
    };
    await onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل الدفعة</DialogTitle>
          <DialogDescription>عدّل بيانات الدفعة</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          id="edit-payment-form"
        >
          <div className="space-y-2">
            <Label htmlFor="epAmount">المبلغ (ر.ي)</Label>
            <Input
              id="epAmount"
              type="text"
              inputMode="decimal"
              autoFocus
              {...register('amount')}
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="epNotes">ملاحظات (اختياري)</Label>
            <Textarea
              id="epNotes"
              rows={3}
              placeholder="ملاحظات إضافية..."
              {...register('notes')}
              disabled={isSubmitting}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="edit-payment-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
