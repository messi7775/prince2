import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  returnInventorySchema,
  type ReturnInventoryInput,
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
import { useReturnInventory } from '../hooks/useReturnInventory';
import { useToast } from '../../../components/ui/use-toast';
import { ApiClientError } from '../../../lib/api-client';

interface ReturnInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: PackageStockSummary | null;
}

export function ReturnInventoryDialog({
  open,
  onOpenChange,
  batch,
}: ReturnInventoryDialogProps) {
  const { toast } = useToast();
  const returnMutation = useReturnInventory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReturnInventoryInput>({
    resolver: zodResolver(returnInventorySchema),
    defaultValues: {
      packageStockId: '',
      quantity: 1,
      description: '',
    },
  });

  useEffect(() => {
    if (open && batch) {
      reset({
        packageStockId: batch.id,
        quantity: 1,
        description: '',
      });
    }
  }, [open, batch, reset]);

  const onSubmit = async (data: ReturnInventoryInput) => {
    try {
      const cleaned: ReturnInventoryInput = {
        packageStockId: data.packageStockId,
        quantity: data.quantity,
        description: data.description?.trim()
          ? data.description.trim()
          : null,
      };
      await returnMutation.mutateAsync(cleaned);
      toast({ title: 'تمت الإعادة' });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشلت الإعادة',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إعادة مخزون</DialogTitle>
          <DialogDescription>
            {batch && (
              <>
                الدفعة: {batch.currentQuantity} شدة • سعر الشدة{' '}
                {batch.unitPrice}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="return-inventory-form"
        >
          <input
            type="hidden"
            {...register('packageStockId')}
          />

          <div className="space-y-2">
            <Label htmlFor="quantity">الكمية</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              step={1}
              {...register('quantity')}
              disabled={returnMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              الكمية موجبة — سيتم إنشاء حركة إعادة إلى الدفعة
            </p>
            {errors.quantity && (
              <p className="text-xs text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">ملاحظات (اختياري)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="سبب الإعادة، رقم العملية، ..."
              {...register('description')}
              disabled={returnMutation.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={returnMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="return-inventory-form"
            disabled={returnMutation.isPending}
          >
            {returnMutation.isPending ? 'جارٍ الإعادة...' : 'إعادة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}