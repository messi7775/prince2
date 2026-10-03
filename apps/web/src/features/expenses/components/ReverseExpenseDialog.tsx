import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reverseExpenseSchema,
  type ReverseExpenseInput,
} from '@prince-net/validation';
import type { Expense } from '@prince-net/types';
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
import { useReverseExpense } from '../hooks/useReverseExpense';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

interface ReverseExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function ReverseExpenseDialog({
  open,
  onOpenChange,
  expense,
}: ReverseExpenseDialogProps) {
  const { toast } = useToast();
  const mutation = useReverseExpense();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReverseExpenseInput>({
    resolver: zodResolver(reverseExpenseSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: ReverseExpenseInput) => {
    if (!expense) return;

    try {
      await mutation.mutateAsync({ id: expense.id, input: data });

      toast({
        title: 'تم عكس المصروف',
        description: `المبلغ: ${formatMoney(expense.amount)}`,
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
          <DialogTitle>عكس مصروف</DialogTitle>
          <DialogDescription>
            سيتم عكس المصروف وإنشاء حركة نقدية معاكسة. لا يمكن التراجع.
          </DialogDescription>
        </DialogHeader>

        {expense && (
          <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الوصف:</span>
              <span className="font-medium truncate max-w-[240px]">
                {expense.description}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ:</span>
              <span className="num font-semibold">
                {formatMoney(expense.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التاريخ:</span>
              <span className="num text-xs">
                {formatDate(expense.expenseDate)}
              </span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="reverse-expense-form"
        >
          <div className="space-y-2">
            <Label htmlFor="expReason">سبب العكس</Label>
            <Textarea
              id="expReason"
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
            form="reverse-expense-form"
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
