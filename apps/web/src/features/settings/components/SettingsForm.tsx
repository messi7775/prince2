import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    updateSettingsSchema,
    type UpdateSettingsInput,
} from '@prince-net/validation';
import type { Settings } from '@prince-net/types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

interface SettingsFormProps {
    settings: Settings;
    onSubmit: (data: UpdateSettingsInput) => Promise<void>;
    isSubmitting: boolean;
}

export function SettingsForm({
    settings,
    onSubmit,
    isSubmitting,
}: SettingsFormProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<UpdateSettingsInput>({
        resolver: zodResolver(updateSettingsSchema),
        defaultValues: {
            networkName: settings.networkName,
            currencyName: settings.currencyName,
            currencySymbol: settings.currencySymbol,
            adminEmail: settings.adminEmail,
            lowStockThreshold: settings.lowStockThreshold,
        },
    });

    useEffect(() => {
        reset({
            networkName: settings.networkName,
            currencyName: settings.currencyName,
            currencySymbol: settings.currencySymbol,
            adminEmail: settings.adminEmail,
            lowStockThreshold: settings.lowStockThreshold,
        });
    }, [settings, reset]);

    const handleFormSubmit = async (data: UpdateSettingsInput) => {
        await onSubmit(data);
    };

    return (
        <form
      onSubmit= { handleSubmit(handleFormSubmit) }
    className = "space-y-4"
    id = "settings-form"
        >
        <div className="grid gap-4 sm:grid-cols-2" >
            <div className="space-y-2" >
                <Label htmlFor="networkName" > اسم الشبكة </Label>
                    < Input
    id = "networkName"
    {...register('networkName') }
    disabled = { isSubmitting }
        />
    {
        errors.networkName && (
            <p className="text-xs text-destructive">
            { errors.networkName.message }
                </p>
          )
    }
        </div>

        < div className = "space-y-2" >
            <Label htmlFor="adminEmail" > البريد الإداري </Label>
                < Input
    id = "adminEmail"
    type = "email"
    dir = "ltr"
    {...register('adminEmail') }
    disabled = { isSubmitting }
        />
        <p className="text-xs text-muted-foreground" >
            البريد الظاهر في الفواتير والمخرجات(منفصل عن بريد تسجيل الدخول).
          </p>
    {
        errors.adminEmail && (
            <p className="text-xs text-destructive" >
            { errors.adminEmail.message }
                </p>
          )
    }
    </div>

        < div className = "space-y-2" >
            <Label htmlFor="currencyName" > اسم العملة </Label>
                < Input
    id = "currencyName"
    {...register('currencyName') }
    disabled = { isSubmitting }
        />
    {
        errors.currencyName && (
            <p className="text-xs text-destructive">
            { errors.currencyName.message }
                </p>
          )
    }
        </div>

        < div className = "space-y-2" >
            <Label htmlFor="currencySymbol" > رمز العملة </Label>
                < Input
    id = "currencySymbol"
    {...register('currencySymbol') }
    disabled = { isSubmitting }
        />
    {
        errors.currencySymbol && (
            <p className="text-xs text-destructive">
            { errors.currencySymbol.message }
                </p>
          )
    }
        </div>

        < div className = "space-y-2 sm:col-span-2" >
            <Label htmlFor="lowStockThreshold" > حد تنبيه المخزون </Label>
                < Input
    id = "lowStockThreshold"
    type = "number"
    min = { 0}
    step = { 1}
    {...register('lowStockThreshold', { valueAsNumber: true }) }
    disabled = { isSubmitting }
        />
        <p className="text-xs text-muted-foreground" >
            أقل كمية يظهر عندها تنبيه في لوحة التحكم.
          </p>
    {
        errors.lowStockThreshold && (
            <p className="text-xs text-destructive" >
            { errors.lowStockThreshold.message }
                </p>
          )
    }
    </div>
        </div>

        < div className = "flex justify-end" >
            <Button
          type="submit"
    form = "settings-form"
    disabled = { isSubmitting || !isDirty
}
        >
{ isSubmitting? 'جارٍ الحفظ...': 'حفظ التعديلات' }
    </Button>
    </div>
    </form>
  );
}
