import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Backup } from '@prince-net/types';
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
import { useToast } from '../../../components/ui/use-toast';
import { useRestoreBackup } from '../hooks/useRestoreBackup';
import { formatDateTime } from '../../../lib/format';
import { formatFileSize } from '../../../lib/file-size';
import { ApiClientError } from '../../../lib/api-client';

const CONFIRM_WORD = 'استعادة';

interface RestoreBackupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    backup: Backup | null;
}

export function RestoreBackupDialog({
    open,
    onOpenChange,
    backup,
}: RestoreBackupDialogProps) {
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState('');
    const mutation = useRestoreBackup();

    useEffect(() => {
        if (open) {
            setConfirmText('');
        }
    }, [open]);

    const isConfirmValid = confirmText.trim() === CONFIRM_WORD;

    const handleRestore = async () => {
        if (!backup || !isConfirmValid) return;

        try {
            await mutation.mutateAsync(backup.id);
            // after success, hook does queryClient.clear() + redirect
        } catch (err) {
            const message =
                err instanceof ApiClientError ? err.message : 'حدث خطأ';
            toast({
                variant: 'destructive',
                title: 'فشلت الاستعادة',
                description: message,
            });
        }
    };

    return (
        <Dialog open= { open } onOpenChange = { onOpenChange } >
            <DialogContent className="sm:max-w-lg" >
                <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive" >
                    <AlertTriangle className="h-5 w-5" />
                        استعادة نسخة احتياطية
                            </DialogTitle>
                            <DialogDescription>
            هذه العملية خطيرة ولا يمكن التراجع عنها.
          </DialogDescription>
        </DialogHeader>

        < div className = "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-2" >
            <p className="font-medium text-destructive" >
                سيتم حذف جميع البيانات الحالية واستبدالها بمحتوى النسخة
    الاحتياطية، بما في ذلك:
    </p>
        < ul className = "list-disc list-inside space-y-1 text-xs text-muted-foreground" >
            <li>المستخدمون(users) </li>
            < li > الباقات، المخزون، الموزعون، المبيعات، الدفعات </li>
                < li > الخطوط، المصروفات، سحوبات المالك، الصندوق </li>
                    < li > الإعدادات </li>
                    </ul>
                    < p className = "text-xs font-medium pt-1" >
                        سيتم إنهاء الجلسة الحالية وإعادة تسجيل الدخول.
          </p>
                            </div>

    {
        backup && (
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm" >
                <div className="flex justify-between gap-3" >
                    <span className="text-muted-foreground" > الملف: </span>
                        < span dir="ltr" className = "font-medium truncate text-end ltr" >
                        { backup.fileName }
                            </span>
                            </div>
                            < div className = "flex justify-between" >
                                <span className="text-muted-foreground" > الحجم: </span>
                                    < span className = "num" > { formatFileSize(backup.sizeBytes) } </span>
                                        </div>
                                        < div className = "flex justify-between" >
                                            <span className="text-muted-foreground" > عدد السجلات: </span>
                                                < span className = "num" > { backup.recordCount } </span>
                                                    </div>
                                                    < div className = "flex justify-between" >
                                                        <span className="text-muted-foreground" > التاريخ: </span>
                                                            < span className = "num text-xs" >
                                                            { formatDateTime(backup.createdAt) }
                                                                </span>
                                                                </div>
                                                                </div>
        )
    }

    <div className="space-y-2" >
        <Label htmlFor="confirmText" >
            للتأكيد، اكتب الكلمة التالية: { ' ' }
    <strong className="text-destructive" > { CONFIRM_WORD } </strong>
        </Label>
        < Input
    id = "confirmText"
    value = { confirmText }
    onChange = {(e) => setConfirmText(e.target.value)
}
placeholder = { CONFIRM_WORD }
disabled = { mutation.isPending }
autoFocus
    />
    </div>

    < DialogFooter >
    <Button
            type="button"
variant = "outline"
onClick = {() => onOpenChange(false)}
disabled = { mutation.isPending }
    >
    تراجع
    </Button>
    < Button
type = "button"
variant = "destructive"
onClick = { handleRestore }
disabled = {!isConfirmValid || mutation.isPending}
          >
{ mutation.isPending ? 'جارٍ الاستعادة...' : 'استعادة النسخة' }
    </Button>
    </DialogFooter>
    </DialogContent>
    </Dialog>
  );
}
