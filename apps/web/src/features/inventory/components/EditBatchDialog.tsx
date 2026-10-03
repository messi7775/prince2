import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateBatchSchema,
  type UpdateBatchInput,
} from '@prince-net/validation';
import type { PackageStockSummary } from '@prince-net/types';
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
import { useToast } from '../../../components/ui/use-toast';
import { apiClient } from '../../../lib/api-client';
import { ApiClientError } from '../../../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

interface EditBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: PackageStockSummary | null;
  packageId?: string;
}

export function EditBatchDialog({
  open,
  onOpenChange,
  batch,
}: EditBatchDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBatchInput>({
    resolver: zodResolver(updateBatchSchema),
    defaultValues: {
      unitPrice: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open && batch) {
      reset({
        unitPrice: batch.unitPrice,
        notes: batch.notes ?? '',
      });
    }
  }, [open, batch, reset]);

  const onSubmit = async (data: UpdateBatchInput) => {
    if (!batch) return;
    try {
      const cleaned: UpdateBatchInput = {
        ...(data.unitPrice?.trim() ? { unitPrice: data.unitPrice.trim() } : {}),
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };
      await apiClient.patch(
        `/inventory/batches/${batch.id}`,
        cleaned,
      );
      toast({ title: 'تم تعديل الدفعة' });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل التعديل',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل الدفعة</DialogTitle>
          <DialogDescription>
            {batch && (
              <>
                الكمية الحالية: {batch.currentQuantity} شدة
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="edit-batch-form"
        >
          <div className="space-y-2">
            <Label htmlFor="unitPrice">سعر الشدة (ر.ي)</Label>
            <Input
              id="unitPrice"
              type="text"
              inputMode="decimal"
              placeholder="80.00"
              {...register('unitPrice')}
              disabled={isSubmitting}
            />
            {errors.unitPrice && (
              <p className="text-xs text-destructive">
                {errors.unitPrice.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="مصدر الدفعة، رقم الشراء، ..."
              {...register('notes')}
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">
                {errors.notes.message}
              </p>
            )}
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
            form="edit-batch-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
