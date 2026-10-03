import { useState } from 'react';
import { Database, Plus } from 'lucide-react';
import type { Backup } from '@prince-net/types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/button';
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
import { useBackups } from '../hooks/useBackups';
import { useCreateBackup } from '../hooks/useCreateBackup';
import { BackupsTable } from '../components/BackupsTable';
import { RestoreBackupDialog } from '../components/RestoreBackupDialog';
import { ApiClientError } from '../../../lib/api-client';

export function BackupPage() {
    const { toast } = useToast();
    const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);

    const backupsQuery = useBackups();
    const createMutation = useCreateBackup();

    const handleCreate = async () => {
        try {
            const backup = await createMutation.mutateAsync();
            toast({
                title: 'تم إنشاء النسخة',
                description: backup.fileName,
            });
        } catch (err) {
            const message =
                err instanceof ApiClientError ? err.message : 'حدث خطأ';
            toast({
                variant: 'destructive',
                title: 'فشل الإنشاء',
                description: message,
            });
        }
    };

    return (
        <div className= "space-y-6" >
        <PageHeader
        title="النسخ الاحتياطي"
    description = "إنشاء وإدارة النسخ الاحتياطية للنظام"
        />

    {/* Create Card */ }
        < Card >
        <CardHeader>
        <CardTitle className="text-base flex items-center gap-2" >
            <Database className="h-4 w-4" />
                إنشاء نسخة جديدة
                    </CardTitle>
                    <CardDescription>
            يقوم النظام بأخذ snapshot كامل من قاعدة البيانات وحفظه في ملف
            مضغوط على السيرفر.
          </CardDescription>
        </CardHeader>
        < CardContent >
        <Button
            onClick={ handleCreate }
    disabled = { createMutation.isPending }
        >
        <Plus className="me-2 h-4 w-4" />
        {
            createMutation.isPending
                ? 'جارٍ الإنشاء...'
                : 'إنشاء نسخة جديدة'
        }
            </Button>
            </CardContent>
            </Card>

    {/* List Card */ }
    <Card>
        <CardHeader>
        <CardTitle className="text-base" > النسخ المتاحة </CardTitle>
            </CardHeader>
            < CardContent className = "p-0" >
                {
                    backupsQuery.isLoading ? (
                        <LoadingState />
                    ) : backupsQuery.isError ? (
                        <ErrorState
              title= "تعذّر تحميل النسخ"
              message={
                        backupsQuery.error instanceof Error
                            ? backupsQuery.error.message
                            : 'حدث خطأ'
                    }
              onRetry={() => backupsQuery.refetch()
                }
                />
          ) : (
        <div className= "p-4" >
        <BackupsTable
                data={ backupsQuery.data ?? [] }
    onRestore = { setRestoreTarget }
        />
        </div>
          )
}
</CardContent>
    </Card>

    < RestoreBackupDialog
open = {!!restoreTarget}
onOpenChange = {(open) => !open && setRestoreTarget(null)}
backup = { restoreTarget }
    />
    </div>
  );
}
