import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateSaleSchema,
  type UpdateSaleInput,
} from '@prince-net/validation';
import type { SaleDetails } from '@prince-net/types';
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
import { apiClient } from '../../../lib/api-client';
import { ApiClientError } from '../../../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { SaleItemsInput } from './SaleItemsInput';

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleDetails | null;
}

export function EditSaleDialog({
  open,
  onOpenChange,
  sale,
}: EditSaleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSaleInput>({
    resolver: zodResolver(updateSaleSchema),
    defaultValues: {
      items: [],
      notes: '',
    },
  });

  useEffect(() => {
    if (open && sale) {
      reset({
        items: sale.items.map((item) => ({
          packageId: item.packageId,
          quantity: item.quantity,
        })),
        notes: sale.notes ?? '',
      });
    }
  }, [open, sale, reset]);

  const onSubmit = async (data: UpdateSaleInput) => {
    if (!sale) return;
    try {
      const cleaned: UpdateSaleInput = {
        items: data.items.map((i) => ({
          packageId: i.packageId,
          quantity: i.quantity,
        })),
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };
      await apiClient.patch(`/sales/${sale.id}`, cleaned);
      toast({ title: 'تم تعديل الفاتورة' });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الفاتورة {sale?.invoiceNumber}</DialogTitle>
          <DialogDescription>
            عدّل الباقات والكميات — سيتم إعادة تخصيص المخزون تلقائياً
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="edit-sale-form"
        >
          <SaleItemsInput
            control={control}
            register={register}
            errors={errors}
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              rows={3}
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
            form="edit-sale-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
