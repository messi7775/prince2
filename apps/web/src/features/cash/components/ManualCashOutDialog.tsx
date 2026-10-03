import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  manualCashOutSchema,
  type ManualCashOutInput,
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
import { DatePicker } from '../../../components/ui/date-picker';
import { useToast } from '../../../components/ui/use-toast';
import { useManualCashOut } from '../hooks/useManualCashOut';
import { ApiClientError } from '../../../lib/api-client';

interface ManualCashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualCashOutDialog({
  open,
  onOpenChange,
}: ManualCashOutDialogProps) {
  const { toast } = useToast();
  const mutation = useManualCashOut();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ManualCashOutInput>({
    resolver: zodResolver(manualCashOutSchema),
    defaultValues: { amount: '', description: '', movementDate: new Date() },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: '', description: '', movementDate: new Date() });
    }
  }, [open, reset]);

  const onSubmit = async (data: ManualCashOutInput) => {
    try {
      const cleaned: ManualCashOutInput = {
        amount: data.amount,
        description: data.description.trim(),
        movementDate: data.movementDate
          ? new Date(data.movementDate)
          : undefined,
      };

      await mutation.mutateAsync(cleaned);

      toast({
        title: 'تم السحب',
        description: `تم سحب ${data.amount}`,
      });

      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل السحب',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>سحب يدوي</DialogTitle>
          <DialogDescription>
            اسحب مبلغًا نقديًا من الصندوق يدويًا
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="manual-cash-out-form"
        >
          <div className="space-y-2">
            <Label htmlFor="cashOutAmount">المبلغ (ر.ي)</Label>
            <Input
              id="cashOutAmount"
              type="text"
              inputMode="decimal"
              placeholder="مثال: 500"
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
            <Label htmlFor="cashOutDescription">الوصف</Label>
            <Input
              id="cashOutDescription"
              placeholder="سبب السحب"
              {...register('description')}
              disabled={mutation.isPending}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashOutDate">التاريخ</Label>
            <Controller
              name="movementDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => field.onChange(date ?? undefined)}
                  disabled={mutation.isPending}
                />
              )}
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
            form="manual-cash-out-form"
            variant="destructive"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'جارٍ السحب...' : 'سحب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}