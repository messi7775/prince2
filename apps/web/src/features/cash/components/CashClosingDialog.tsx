import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCashClosingSchema,
  type CreateCashClosingInput,
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
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../components/ui/use-toast';
import { previewClosing } from '../api/closings';
import { useCreateCashClosing } from '../hooks/useCreateCashClosing';
import { ApiClientError } from '../../../lib/api-client';
import { formatMoney } from '../../../lib/currency';

interface CashClosingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CashClosingDialog({ open, onOpenChange }: CashClosingDialogProps) {
  const { toast } = useToast();
  const mutation = useCreateCashClosing();
  const [closingDate, setClosingDate] = useState(todayISO);

  const previewQuery = useQuery({
    queryKey: ['cash', 'closing-preview', closingDate],
    queryFn: () => previewClosing(closingDate),
    enabled: open && /^\d{4}-\d{2}-\d{2}$/.test(closingDate),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCashClosingInput>({
    resolver: zodResolver(createCashClosingSchema),
    defaultValues: { closingDate: todayISO(), actualBalance: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      const today = todayISO();
      setClosingDate(today);
      reset({ closingDate: today, actualBalance: '', notes: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateCashClosingInput) => {
    try {
      await mutation.mutateAsync({
        closingDate,
        actualBalance: data.actualBalance,
        notes: data.notes?.trim() || null,
      });
      toast({ title: 'تم إغلاق اليوم', description: `تم إغلاق ${closingDate}` });
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'فشل الإغلاق',
        description: err instanceof ApiClientError ? err.message : 'حدث خطأ',
      });
    }
  };

  const preview = previewQuery.data;
  const alreadyClosed = preview?.alreadyClosed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إغلاق الصندوق اليومي</DialogTitle>
          <DialogDescription>
            عدّ الرصيد الفعلي في الصندوق وقارنه بالمتوقع — تُحفظ اللقطة نهائيًا
            للمراجعة ولا يمكن تعديلها لاحقًا
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="cash-closing-form"
        >
          <div className="space-y-2">
            <Label htmlFor="closingDate">تاريخ الإغلاق</Label>
            <Input
              id="closingDate"
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          {previewQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              جارٍ حساب الرصيد المتوقع...
            </p>
          ) : preview ? (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              {alreadyClosed && (
                <Badge variant="secondary">هذا اليوم مُغلق بالفعل</Badge>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">رصيد افتتاحي</span>
                <span className="num font-medium">
                  {formatMoney(preview.openingBalance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الوارد</span>
                <span className="num font-medium text-green-600">
                  {formatMoney(preview.totalIn)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الصادر</span>
                <span className="num font-medium text-destructive">
                  {formatMoney(preview.totalOut)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">سحوبات المالك</span>
                <span className="num font-medium">
                  {formatMoney(preview.ownerWithdrawals)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-semibold">الرصيد المتوقع</span>
                <span className="num font-bold">
                  {formatMoney(preview.expectedBalance)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="actualBalance">الرصيد الفعلي المعدود (ر.ي)</Label>
            <Input
              id="actualBalance"
              type="text"
              inputMode="decimal"
              placeholder={preview ? preview.expectedBalance : 'مثال: 1000.00'}
              autoFocus
              {...register('actualBalance')}
              disabled={mutation.isPending || alreadyClosed}
            />
            {errors.actualBalance && (
              <p className="text-xs text-destructive">
                {errors.actualBalance.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="closingNotes">ملاحظات (اختياري)</Label>
            <Textarea
              id="closingNotes"
              placeholder="ملاحظات حول الإغلاق أو الفروقات..."
              {...register('notes')}
              disabled={mutation.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="cash-closing-form"
            disabled={mutation.isPending || alreadyClosed || !preview}
          >
            {mutation.isPending ? 'جارٍ الإغلاق...' : 'تأكيد الإغلاق'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
