import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createOwnerWithdrawalSchema,
  type CreateOwnerWithdrawalInput,
} from '@prince-net/validation';
import type { OwnerWithdrawal } from '@prince-net/types';
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

interface OwnerWithdrawalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOwnerWithdrawalInput) => Promise<void>;
  isSubmitting: boolean;
  initialData?: OwnerWithdrawal | null;
}

export function OwnerWithdrawalFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: OwnerWithdrawalFormDialogProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateOwnerWithdrawalInput>({
    resolver: zodResolver(createOwnerWithdrawalSchema),
    defaultValues: {
      amount: '',
      reason: '',
      withdrawalDate: new Date(),
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          amount: initialData.amount,
          reason: initialData.reason,
          withdrawalDate: initialData.withdrawalDate
            ? new Date(initialData.withdrawalDate)
            : new Date(),
          notes: initialData.notes ?? '',
        });
      } else {
        reset({
          amount: '',
          reason: '',
          withdrawalDate: new Date(),
          notes: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: CreateOwnerWithdrawalInput) => {
    const cleaned: CreateOwnerWithdrawalInput = {
      amount: data.amount,
      reason: data.reason.trim(),
      withdrawalDate: data.withdrawalDate
        ? new Date(data.withdrawalDate)
        : undefined,
      notes: data.notes?.trim() ? data.notes.trim() : null,
    };
    await onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل السحب' : 'سحب جديد'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'عدّل بيانات السحب' : 'سجّل عملية سحب من الصندوق'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          id="owner-withdrawal-form"
        >
          <div className="space-y-2">
            <Label htmlFor="owAmount">المبلغ (ر.ي)</Label>
            <Input
              id="owAmount"
              type="text"
              inputMode="decimal"
              placeholder="مثال: 5,000"
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
            <Label htmlFor="owReason">السبب</Label>
            <Input
              id="owReason"
              placeholder="سبب السحب (مطلوب)"
              {...register('reason')}
              disabled={isSubmitting}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owDate">التاريخ</Label>
            <Controller
              name="withdrawalDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => field.onChange(date ?? undefined)}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owNotes">ملاحظات (اختياري)</Label>
            <Textarea
              id="owNotes"
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
            form="owner-withdrawal-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'جارٍ الحفظ...'
              : isEdit
                ? 'حفظ التعديلات'
                : 'سحب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
