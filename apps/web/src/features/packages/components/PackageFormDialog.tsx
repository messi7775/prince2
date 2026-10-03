import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPackageSchema,
  type CreatePackageInput,
} from '@prince-net/validation';
import type { PackageEntity } from '@prince-net/types';
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

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePackageInput) => Promise<void>;
  initialData?: PackageEntity | null;
  isSubmitting: boolean;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: PackageFormDialogProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePackageInput>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      name: '',
      price: '',
      dataSizeMb: 0,
      hours: 0,
      color: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          price: initialData.price,
          dataSizeMb: initialData.dataSizeMb,
          hours: initialData.hours,
          color: initialData.color ?? '',
          description: initialData.description ?? '',
        });
      } else {
        reset({
          name: '',
          price: '',
          dataSizeMb: 0,
          hours: 0,
          color: '',
          description: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: CreatePackageInput) => {
    // تنظيف nullables
    const cleaned: CreatePackageInput = {
      name: data.name,
      price: data.price,
      dataSizeMb: data.dataSizeMb,
      hours: data.hours,
      color: data.color?.trim() ? data.color.trim() : null,
      description: data.description?.trim() ? data.description.trim() : null,
    };
    await onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'عدّل بيانات الباقة'
              : 'أدخل بيانات الباقة الجديدة'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          id="package-form"
        >
          <div className="space-y-2">
            <Label htmlFor="name">اسم الباقة</Label>
            <Input
              id="name"
              placeholder="باقة 100 ريال"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">سعر الكرت (ر.ي)</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                placeholder="100"
                {...register('price')}
                disabled={isSubmitting}
              />
              {errors.price && (
                <p className="text-xs text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">اللون (اختياري)</Label>
              <Input
                id="color"
                placeholder="blue"
                {...register('color')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataSizeMb">حجم البيانات (MB)</Label>
              <Input
                id="dataSizeMb"
                type="number"
                min={0}
                {...register('dataSizeMb')}
                disabled={isSubmitting}
              />
              {errors.dataSizeMb && (
                <p className="text-xs text-destructive">
                  {errors.dataSizeMb.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">الساعات</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                {...register('hours')}
                disabled={isSubmitting}
              />
              {errors.hours && (
                <p className="text-xs text-destructive">
                  {errors.hours.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="وصف مختصر للباقة"
              {...register('description')}
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
            form="package-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'جارٍ الحفظ...'
              : isEdit
                ? 'حفظ التعديلات'
                : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}