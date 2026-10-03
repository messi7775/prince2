import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExpenseCategorySchema,
  type CreateExpenseCategoryInput,
} from '@prince-net/validation';
import type { ExpenseCategory } from '@prince-net/types';
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

interface ExpenseCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateExpenseCategoryInput) => Promise<void>;
  initialData?: ExpenseCategory | null;
  isSubmitting: boolean;
}

export function ExpenseCategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: ExpenseCategoryFormDialogProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseCategoryInput>({
    resolver: zodResolver(createExpenseCategorySchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description ?? '',
        });
      } else {
        reset({ name: '', description: '' });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: CreateExpenseCategoryInput) => {
    const cleaned: CreateExpenseCategoryInput = {
      name: data.name,
      description: data.description?.trim()
        ? data.description.trim()
        : null,
    };
    await onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'عدّل بيانات التصنيف' : 'أدخل بيانات التصنيف'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          id="expense-category-form"
        >
          <div className="space-y-2">
            <Label htmlFor="name">اسم التصنيف</Label>
            <Input
              id="name"
              autoFocus
              placeholder="مثال: إنترنت، كهرباء، ..."
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
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="وصف مختصر للتصنيف"
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
            form="expense-category-form"
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