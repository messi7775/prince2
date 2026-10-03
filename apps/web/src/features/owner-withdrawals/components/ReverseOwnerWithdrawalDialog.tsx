import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reverseOwnerWithdrawalSchema,
  type ReverseOwnerWithdrawalInput,
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
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/use-toast';
import { useReverseOwnerWithdrawal } from '../hooks/useReverseOwnerWithdrawal';
import { formatMoney } from '../../../lib/currency';
import { formatDate } from '../../../lib/format';
import { ApiClientError } from '../../../lib/api-client';

interface ReverseOwnerWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: OwnerWithdrawal | null;
}

export function ReverseOwnerWithdrawalDialog({
  open,
  onOpenChange,
  withdrawal,
}: ReverseOwnerWithdrawalDialogProps) {
  const { toast } = useToast();
  const mutation = useReverseOwnerWithdrawal();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReverseOwnerWithdrawalInput>({
    resolver: zodResolver(reverseOwnerWithdrawalSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: ReverseOwnerWithdrawalInput) => {
    if (!withdrawal) return;

    try {
      await mutation.mutateAsync({ id: withdrawal.id, input: data });

      toast({
        title: 'تم عكس السحب',
        description: `المبلغ: ${formatMoney(withdrawal.amount)}`,
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
          <DialogTitle>عكس سحب المالك</DialogTitle>
          <DialogDescription>
            سيتم عكس السحب وإنشاء حركة نقدية معاكسة. لا يمكن التراجع.
          </DialogDescription>
        </DialogHeader>

        {withdrawal && (
          <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">السبب:</span>
              <span className="font-medium truncate max-w-[240px]">
                {withdrawal.reason}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ:</span>
              <span className="num font-semibold">
                {formatMoney(withdrawal.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التاريخ:</span>
              <span className="num text-xs">
                {formatDate(withdrawal.withdrawalDate)}
              </span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="reverse-owner-withdrawal-form"
        >
          <div className="space-y-2">
            <Label htmlFor="owReason">سبب العكس</Label>
            <Textarea
              id="owReason"
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
            form="reverse-owner-withdrawal-form"
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
