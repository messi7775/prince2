import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  cancelSaleSchema,
  type CancelSaleInput,
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
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

interface CancelSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: CancelSaleInput) => Promise<void>;
  invoiceNumber: string;
  isLoading: boolean;
}

export function CancelSaleDialog({
  open,
  onOpenChange,
  onConfirm,
  invoiceNumber,
  isLoading,
}: CancelSaleDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelSaleInput>({
    resolver: zodResolver(cancelSaleSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إلغاء الفاتورة</DialogTitle>
          <DialogDescription>
            سيتم إلغاء الفاتورة <strong>{invoiceNumber}</strong> — سيُعكس أثر
            الدفعات ويُعاد المخزون تلقائيًا.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onConfirm)}
          className="space-y-4"
          id="cancel-sale-form"
        >
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الإلغاء</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="سبب الإلغاء (مطلوب)"
              {...register('reason')}
              disabled={isLoading}
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
            disabled={isLoading}
          >
            تراجع
          </Button>
          <Button
            type="submit"
            form="cancel-sale-form"
            variant="destructive"
            disabled={isLoading}
          >
            {isLoading ? 'جارٍ الإلغاء...' : 'تأكيد الإلغاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}