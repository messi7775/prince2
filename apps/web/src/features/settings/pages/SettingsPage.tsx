import { Settings as SettingsIcon, Shield } from 'lucide-react';
import type { UpdateSettingsInput } from '@prince-net/validation';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { useToast } from '../../../components/ui/use-toast';
import { useSettings } from '../hooks/useSettings';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { SettingsForm } from '../components/SettingsForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { ApiClientError } from '../../../lib/api-client';

export function SettingsPage() {
    const { toast } = useToast();

    const settingsQuery = useSettings();
    const updateMutation = useUpdateSettings();

    const handleSettingsSubmit = async (input: UpdateSettingsInput) => {
        try {
            await updateMutation.mutateAsync(input);
            toast({ title: 'تم حفظ الإعدادات' });
        } catch (err) {
            const message =
                err instanceof ApiClientError ? err.message : 'حدث خطأ';
            toast({
                variant: 'destructive',
                title: 'فشل الحفظ',
                description: message,
            });
        }
    };

    return (
        <div className= "space-y-6" >
        <PageHeader
        title="الإعدادات"
    description = "إعدادات النظام وكلمة المرور"
        />

    {/* System Settings */ }
        < Card >
        <CardHeader>
        <CardTitle className="text-base flex items-center gap-2" >
            <SettingsIcon className="h-4 w-4" />
                إعدادات النظام
                    </CardTitle>
                    <CardDescription>
            هذه الإعدادات تُطبَّق على كل النظام وتظهر في الفواتير والمخرجات.
          </CardDescription>
        </CardHeader>
        <CardContent>
    {
        settingsQuery.isLoading ? (
            <LoadingState />
        ) : settingsQuery.isError || !settingsQuery.data ? (
            <ErrorState
              title= "تعذّر تحميل الإعدادات"
              message = {
            settingsQuery.error instanceof Error
                ? settingsQuery.error.message
                : 'حدث خطأ'
        }
        onRetry = {() => settingsQuery.refetch()
    }
            />
          ) : (
        <SettingsForm
              settings= { settingsQuery.data }
    onSubmit = { handleSettingsSubmit }
    isSubmitting = { updateMutation.isPending }
        />
          )
}
</CardContent>
    </Card>

{/* Change Password */ }
<Card>
    <CardHeader>
    <CardTitle className="text-base flex items-center gap-2" >
        <Shield className="h-4 w-4" />
            تغيير كلمة المرور
                </CardTitle>
                <CardDescription>
            يجب إدخال كلمة المرور الحالية للتحقق.
          </CardDescription>
    </CardHeader>
    < CardContent >
    <ChangePasswordForm />
    </CardContent>
    </Card>
    </div>
  );
}
