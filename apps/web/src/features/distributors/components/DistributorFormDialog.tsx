import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createDistributorSchema,
  type CreateDistributorInput,
} from '@prince-net/validation';
import type { Distributor } from '@prince-net/types';
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

interface DistributorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDistributorInput) => Promise<void>;
  initialData?: Distributor | null;
  isSubmitting: boolean;
}

export function DistributorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: DistributorFormDialogProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDistributorInput>({
    resolver: zodResolver(createDistributorSchema),
    defaultValues: { name: '', phone: '', address: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          phone: initialData.phone,
          address: initialData.address ?? '',
          notes: initialData.notes ?? '',
        });
      } else {
        reset({ name: '', phone: '', address: '', notes: '' });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: CreateDistributorInput) => {
    const cleaned: CreateDistributorInput = {
      name: data.name,
      phone: data.phone,
      address: data.address?.trim() ? data.address.trim() : null,
      notes: data.notes?.trim() ? data.notes.trim() : null,
    };
    await onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'تعديل الموزع' : 'إضافة موزع جديد'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'عدّل بيانات الموزع' : 'أدخل بيانات الموزع'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          id="distributor-form"
        >
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              autoFocus
              placeholder="اسم الموزع"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="7XXXXXXXX"
              {...register('phone')}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان (اختياري)</Label>
            <Input
              id="address"
              placeholder="العنوان"
              {...register('address')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="ملاحظات إضافية..."
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
            form="distributor-form"
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