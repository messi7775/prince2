import { Trash2, Plus } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type FieldValues,
} from 'react-hook-form';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { usePackages } from '../../packages/hooks/usePackages';

type SaleItemForm = {
  packageId: string;
  quantity: number;
};

type SaleItemsForm = FieldValues & {
  items: SaleItemForm[];
};

interface SaleItemsInputProps<T extends SaleItemsForm> {
  control: Control<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  disabled?: boolean;
}

export function SaleItemsInput<T extends SaleItemsForm>({
  control,
  register,
  errors,
  disabled = false,
}: SaleItemsInputProps<T>) {
  const saleItemsControl = control as unknown as Control<SaleItemsForm>;
  const saleItemsRegister =
    register as unknown as UseFormRegister<SaleItemsForm>;
  const saleItemsErrors = errors as FieldErrors<SaleItemsForm>;

  const { fields, append, remove } = useFieldArray({
    control: saleItemsControl,
    name: 'items',
  });

  const packagesQuery = usePackages({
    page: 1,
    limit: 100,
    status: 'ACTIVE',
  });

  const packages = packagesQuery.data?.data ?? [];

  const handleAdd = () => {
    append({
      packageId: '',
      quantity: 1,
    });
  };

  const itemErrors = saleItemsErrors.items;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>الباقات</Label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || packages.length === 0}
        >
          <Plus className="me-2 h-4 w-4" />
          إضافة باقة
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-md border py-4 text-center text-xs text-muted-foreground">
          لم تُضف أي باقة بعد
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const currentItemError = Array.isArray(itemErrors)
            ? itemErrors[index]
            : undefined;

          return (
            <div
              key={field.id}
              className="space-y-3 rounded-md border bg-muted/30 p-3"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs">الباقة</Label>

                  <Controller
                    control={saleItemsControl}
                    name={`items.${index}.packageId`}
                    render={({ field: controllerField }) => (
                      <Select
                        value={controllerField.value}
                        onValueChange={controllerField.onChange}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الباقة" />
                        </SelectTrigger>

                        <SelectContent>
                          {packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {currentItemError?.packageId?.message && (
                    <p className="text-xs text-destructive">
                      {String(currentItemError.packageId.message)}
                    </p>
                  )}
                </div>

                <div className="w-24 space-y-1">
                  <Label className="text-xs">الكمية</Label>

                  <Input
                    type="number"
                    min={1}
                    step={1}
                    {...saleItemsRegister(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    disabled={disabled}
                  />

                  {currentItemError?.quantity?.message && (
                    <p className="text-xs text-destructive">
                      {String(currentItemError.quantity.message)}
                    </p>
                  )}
                </div>

                <div className="pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={disabled}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {itemErrors &&
        !Array.isArray(itemErrors) &&
        typeof itemErrors.message === 'string' && (
          <p className="text-xs text-destructive">
            {itemErrors.message}
          </p>
        )}
    </div>
  );
}