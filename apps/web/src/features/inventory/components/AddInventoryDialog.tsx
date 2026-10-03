import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  addInventorySchema,
  type AddInventoryInput,
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
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { usePackages } from '../../packages/hooks/usePackages';
import { useAddInventory } from '../hooks/useAddInventory';
import { useToast } from '../../../components/ui/use-toast';
import { ApiClientError } from '../../../lib/api-client';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPackageId?: string;
}

export function AddInventoryDialog({
  open,
  onOpenChange,
  defaultPackageId,
}: AddInventoryDialogProps) {
  const { toast } = useToast();
  const addMutation = useAddInventory();

  // جلب الباقات للـ Select
  const packagesQuery = usePackages({ page: 1, limit: 100, status: 'ACTIVE' });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddInventoryInput>({
    resolver: zodResolver(addInventorySchema),
    defaultValues: {
      packageId: defaultPackageId ?? '',
      quantity: 1,
      unitPrice: '',
      description: '',
    },
  });

  const selectedPackageId = watch('packageId');

  useEffect(() => {
    if (open) {
      reset({
        packageId: defaultPackageId ?? '',
        quantity: 1,
        unitPrice: '',
        description: '',
      });
    }
  }, [open, defaultPackageId, reset]);

  const onSubmit = async (data: AddInventoryInput) => {
    try {
      const cleaned: AddInventoryInput = {
        packageId: data.packageId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        description: data.description?.trim()
          ? data.description.trim()
          : null,
      };
      await addMutation.mutateAsync(cleaned);
      toast({
        title: 'تمت الإضافة',
        description: 'تمت إضافة دفعة المخزون بنجاح',
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'حدث خطأ';
      toast({
        variant: 'destructive',
        title: 'فشل الإضافة',
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة دفعة مخزون</DialogTitle>
          <DialogDescription>
            سيتم إنشاء دفعة جديدة بحساب سعر الشدة الخاص بها
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="add-inventory-form"
        >
          {/* Package Select */}
          <div className="space-y-2">
            <Label htmlFor="packageId">الباقة</Label>
            <Select
              value={selectedPackageId}
              onValueChange={(v) =>
                setValue('packageId', v, { shouldValidate: true })
              }
              disabled={!!defaultPackageId || addMutation.isPending}
            >
              <SelectTrigger id="packageId">
                <SelectValue placeholder="اختر الباقة" />
              </SelectTrigger>
              <SelectContent>
                {packagesQuery.data?.data.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.packageId && (
              <p className="text-xs text-destructive">
                {errors.packageId.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">كمية الشدات</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                step={1}
                {...register('quantity')}
                disabled={addMutation.isPending}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice">سعر الشدة (ر.ي)</Label>
              <Input
                id="unitPrice"
                type="text"
                inputMode="decimal"
                placeholder="80.00"
                {...register('unitPrice')}
                disabled={addMutation.isPending}
              />
              {errors.unitPrice && (
                <p className="text-xs text-destructive">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">ملاحظات (اختياري)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="مصدر الدفعة، رقم الشراء، ..."
              {...register('description')}
              disabled={addMutation.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="add-inventory-form"
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}