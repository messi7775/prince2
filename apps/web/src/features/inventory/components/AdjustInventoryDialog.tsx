import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  adjustInventorySchema,
  type AdjustInventoryInput,
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
import { useAdjustInventory } from '../hooks/useAdjustInventory';
import { useToast } from '../../../components/ui/use-toast';
import { ApiClientError } from '../../../lib/api-client';

interface AdjustInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: PackageStockSummary | null;
}

export function AdjustInventoryDialog({
  open,
  onOpenChange,
  batch,
}: AdjustInventoryDialogProps) {
  const { toast } = useToast();
  const adjustMutation = useAdjustInventory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustInventoryInput>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: {
      packageStockId: '',
      quantityDelta: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (open && batch) {
      reset({
        packageStockId: batch.id,
        quantityDelta: 0,
        description: '',
      });
    }
  }, [open, batch, reset]);

  const onSubmit = async (data: AdjustInventoryInput) => {
    try {
      await adjustMutation.mutateAsync(data);
      toast({ title: 'تم التعديل' });
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
          <DialogTitle>تعديل المخزون</DialogTitle>
          <DialogDescription>
            {batch && (
              <>
                الدفعة الحالية: {batch.currentQuantity} شدة • سعر الشدة{' '}
                {batch.unitPrice}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="adjust-inventory-form"
        >
          <input
            type="hidden"
            {...register('packageStockId')}
          />

          <div className="space-y-2">
            <Label htmlFor="quantityDelta">
              مقدار التعديل (+ للزيادة / - للنقصان)
            </Label>
            <Input
              id="quantityDelta"
              type="number"
              step={1}
              placeholder="مثال: 10 أو -5"
              {...register('quantityDelta')}
              disabled={adjustMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              <strong>+10</strong> = إضافة 10 شدات • <strong>-5</strong> =
              خصم 5 شدات
            </p>
            {errors.quantityDelta && (
              <p className="text-xs text-destructive">
                {errors.quantityDelta.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">السبب</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="سبب التعديل (جرد، تلف، ...)"
              {...register('description')}
              disabled={adjustMutation.isPending}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={adjustMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="adjust-inventory-form"
            disabled={adjustMutation.isPending}
          >
            {adjustMutation.isPending ? 'جارٍ التعديل...' : 'تعديل'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}