import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    changePasswordSchema,
    type ChangePasswordInput,
} from '@prince-net/validation';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/use-toast';
import { useChangePassword } from '../../auth/hooks/useChangePassword';
import { ApiClientError } from '../../../lib/api-client';

export function ChangePasswordForm() {
    const { toast } = useToast();
    const mutation = useChangePassword();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordInput>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    }, [reset]);

    const handleFormSubmit = async (data: ChangePasswordInput) => {
        try {
            await mutation.mutateAsync(data);
            // success → hook handles queryClient.clear + redirect
            toast({
                title: 'تم تغيير كلمة المرور',
                description: 'جارٍ إعادة توجيهك لتسجيل الدخول...',
            });
        } catch (err) {
            const message =
                err instanceof ApiClientError ? err.message : 'حدث خطأ';
            toast({
                variant: 'destructive',
                title: 'فشل التغيير',
                description: message,
            });
        }
    };

    return (
        <form
      onSubmit= { handleSubmit(handleFormSubmit) }
    className = "space-y-4"
    id = "change-password-form"
        >
        <div className="space-y-2" >
            <Label htmlFor="currentPassword" > كلمة المرور الحالية </Label>
                < Input
    id = "currentPassword"
    type = "password"
    autoComplete = "current-password"
    {...register('currentPassword') }
    disabled = { mutation.isPending }
        />
    {
        errors.currentPassword && (
            <p className="text-xs text-destructive">
            { errors.currentPassword.message }
                </p>
        )
    }
        </div>

        < div className = "grid gap-4 sm:grid-cols-2" >
            <div className="space-y-2" >
                <Label htmlFor="newPassword" > كلمة المرور الجديدة </Label>
                    < Input
    id = "newPassword"
    type = "password"
    autoComplete = "new-password"
    {...register('newPassword') }
    disabled = { mutation.isPending }
        />
    {
        errors.newPassword && (
            <p className="text-xs text-destructive">
            { errors.newPassword.message }
                </p>
          )
    }
        </div>

        < div className = "space-y-2" >
            <Label htmlFor="confirmPassword" > تأكيد كلمة المرور </Label>
                < Input
    id = "confirmPassword"
    type = "password"
    autoComplete = "new-password"
    {...register('confirmPassword') }
    disabled = { mutation.isPending }
        />
    {
        errors.confirmPassword && (
            <p className="text-xs text-destructive">
            { errors.confirmPassword.message }
                </p>
          )
    }
        </div>
        </div>

        < div className = "rounded-md bg-muted/50 p-3 text-xs text-muted-foreground" >
            بعد تغيير كلمة المرور سيتم إنهاء الجلسة الحالية وإعادة توجيهك إلى
        صفحة تسجيل الدخول.
      </div>

        < div className = "flex justify-end" >
            <Button
          type="submit"
    form = "change-password-form"
    disabled = { mutation.isPending }
        >
    { mutation.isPending ? 'جارٍ التغيير...' : 'تغيير كلمة المرور' }
        </Button>
        </div>
        </form>
  );
}
