import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  manualCashInSchema,
  type ManualCashInInput,
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
import { useManualCashIn } from '../hooks/useManualCashIn';
import { ApiClientError } from '../../../lib/api-client';

interface ManualCashInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualCashInDialog({
  open,
  onOpenChange,
}: ManualCashInDialogProps) {
  const { toast } = useToast();
  const mutation = useManualCashIn();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ManualCashInInput>({
    resolver: zodResolver(manualCashInSchema),
    defaultValues: { amount: '', description: '', movementDate: new Date() },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: '', description: '', movementDate: new Date() });
    }
  }, [open, reset]);

  const onSubmit = async (data: ManualCashInInput) => {
    try {
      const cleaned: ManualCashInInput = {
        amount: data.amount,
        description: data.description.trim(),
        movementDate: data.movementDate
          ? new Date(data.movementDate)
          : undefined,
      };

      await mutation.mutateAsync(cleaned);

      toast({
        title: 'تم الإيداع',
        description: `تم إيداع ${data.amount}`,
      });

      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل الإيداع',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إيداع يدوي</DialogTitle>
          <DialogDescription>
            أضف مبلغًا نقديًا إلى الصندوق يدويًا
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="manual-cash-in-form"
        >
          <div className="space-y-2">
            <Label htmlFor="cashInAmount">المبلغ (ر.ي)</Label>
            <Input
              id="cashInAmount"
              type="text"
              inputMode="decimal"
              placeholder="مثال: 1000.00"
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
            <Label htmlFor="cashInDescription">الوصف</Label>
            <Input
              id="cashInDescription"
              placeholder="سبب الإيداع"
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
            <Label htmlFor="cashInDate">التاريخ</Label>
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
            form="manual-cash-in-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'جارٍ الإيداع...' : 'إيداع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}