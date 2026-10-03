import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSaleSchema,
  type CreateSaleInput,
} from '@prince-net/validation';
import { useNavigate } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useToast } from '../../../components/ui/use-toast';
import { useDistributors } from '../../distributors/hooks/useDistributors';
import { useCreateSale } from '../hooks/useCreateSale';
import { SaleItemsInput } from './SaleItemsInput';
import { ApiClientError } from '../../../lib/api-client';

interface SaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleFormDialog({ open, onOpenChange }: SaleFormDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const createMutation = useCreateSale();

  const distributorsQuery = useDistributors({
    page: 1,
    limit: 100,
    status: 'ACTIVE',
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSaleInput>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      distributorId: '',
      items: [],
      initialPayment: null,
      notes: '',
    },
  });

  const selectedDistributorId = watch('distributorId');

  useEffect(() => {
    if (open) {
      reset({
        distributorId: '',
        items: [],
        initialPayment: null,
        notes: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateSaleInput) => {
    try {
      const cleaned: CreateSaleInput = {
        distributorId: data.distributorId,
        items: data.items.map((i) => ({
          packageId: i.packageId,
          quantity: i.quantity,
        })),
        initialPayment: data.initialPayment?.trim()
          ? data.initialPayment.trim()
          : null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };

      const result = await createMutation.mutateAsync(cleaned);

      toast({
        title: 'تم إنشاء الفاتورة',
        description: result.invoiceNumber,
      });

      onOpenChange(false);
      navigate(`/sales/${result.id}`);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل الإنشاء',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>فاتورة بيع جديدة</DialogTitle>
          <DialogDescription>
            اختر الموزع وأضف الباقات — الأسعار تُحسب في الخادم حسب سعر الشدة من المخزون
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="sale-form"
        >
          {/* Distributor */}
          <div className="space-y-2">
            <Label htmlFor="distributorId">الموزع</Label>
            <Select
              value={selectedDistributorId}
              onValueChange={(v) =>
                setValue('distributorId', v, { shouldValidate: true })
              }
              disabled={createMutation.isPending}
            >
              <SelectTrigger id="distributorId">
                <SelectValue placeholder="اختر الموزع" />
              </SelectTrigger>
              <SelectContent>
                {distributorsQuery.data?.data.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} — {d.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.distributorId && (
              <p className="text-xs text-destructive">
                {errors.distributorId.message}
              </p>
            )}
          </div>

          {/* Items */}
          <SaleItemsInput
            control={control}
            register={register}
            errors={errors}
            disabled={createMutation.isPending}
          />

          {/* Initial Payment */}
          <div className="space-y-2">
            <Label htmlFor="initialPayment">
              دفعة أولية (اختياري)
            </Label>
            <Input
              id="initialPayment"
              type="text"
              inputMode="decimal"
              placeholder="مثال: 500"
              {...register('initialPayment')}
              disabled={createMutation.isPending}
            />
            {errors.initialPayment && (
              <p className="text-xs text-destructive">
                {errors.initialPayment.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              rows={3}
              {...register('notes')}
              disabled={createMutation.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="sale-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الفاتورة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}