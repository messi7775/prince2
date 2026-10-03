import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from '@prince-net/validation';
import type { Expense } from '@prince-net/types';
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
import { DatePicker } from '../../../components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useExpenseCategories } from '../../expense-categories/hooks/useExpenseCategories';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateExpenseInput) => Promise<void>;
  initialData?: Expense | null;
  isSubmitting: boolean;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: ExpenseFormDialogProps) {
  const isEdit = !!initialData;

  const categoriesQuery = useExpenseCategories();
  const categories = categoriesQuery.data ?? [];
  const availableCategories = isEdit
    ? categories
    : categories.filter((c) => c.isActive);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      categoryId: '',
      description: '',
      amount: '',
      expenseDate: undefined,
      notes: '',
    },
  });

  const selectedCategoryId = watch('categoryId');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          categoryId: initialData.categoryId,
          description: initialData.description,
          amount: initialData.amount,
          expenseDate: initialData.expenseDate
            ? new Date(initialData.expenseDate)
            : undefined,
          notes: initialData.notes ?? '',
        });
      } else {
        reset({
          categoryId: '',
          description: '',
          amount: '',
          expenseDate: new Date(),
          notes: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: CreateExpenseInput) => {
    const cleaned: CreateExpenseInput = {
      categoryId: data.categoryId,
      description: data.description.trim(),
      amount: data.amount,
      expenseDate: data.expenseDate
        ? new Date(data.expenseDate)
        : undefined,
      notes: data.notes?.trim() ? data.notes.trim() : null,
    };
    await onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'عدّل بيانات المصروف' : 'أدخل بيانات المصروف'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          id="expense-form"
        >
          <div className="space-y-2">
            <Label htmlFor="categoryId">التصنيف</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(v) =>
                setValue('categoryId', v, { shouldValidate: true })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {!c.isActive ? ' (معطّل)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Input
              id="description"
              placeholder="وصف المصروف"
              {...register('description')}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (ر.ي)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="مثال: 1500"
                {...register('amount')}
                disabled={isSubmitting}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDate">التاريخ</Label>
              <Controller
                name="expenseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date ?? undefined)}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
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
            form="expense-form"
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
