import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
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
import { useDeleteBackup } from '../hooks/useDeleteBackup';
import { formatDateTime } from '../../../lib/format';
import { formatFileSize } from '../../../lib/file-size';
import { ApiClientError } from '../../../lib/api-client';

const CONFIRM_WORD = 'حذف';

interface DeleteBackupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    backup: Backup | null;
}

export function DeleteBackupDialog({
    open,
    onOpenChange,
    backup,
}: DeleteBackupDialogProps) {
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState('');
    const mutation = useDeleteBackup();

    useEffect(() => {
        if (open) {
            setConfirmText('');
        }
    }, [open]);

    const isConfirmValid = confirmText.trim() === CONFIRM_WORD;

    const handleDelete = async () => {
        if (!backup || !isConfirmValid) return;

        try {
            await mutation.mutateAsync(backup.id);
            onOpenChange(false);
            toast({
                title: 'تم حذف النسخة',
                description: backup.fileName,
            });
        } catch (err) {
            const message =
                err instanceof ApiClientError ? err.message : 'حدث خطأ';
            toast({
                variant: 'destructive',
                title: 'فشل الحذف',
                description: message,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        حذف النسخة الاحتياطية
                    </DialogTitle>
                    <DialogDescription>
                        سيتم حذف ملف النسخة وسجلها من السيرفر نهائيًا،
                        ولا يمكن التراجع عن هذه العملية.
                    </DialogDescription>
                </DialogHeader>

                {backup && (
                    <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                                الملف:
                            </span>
                            <span className="font-medium truncate text-end">
                                {backup.fileName}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                الحجم:
                            </span>
                            <span className="num">
                                {formatFileSize(backup.sizeBytes)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                عدد السجلات:
                            </span>
                            <span className="num">{backup.recordCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                التاريخ:
                            </span>
                            <span>{formatDateTime(backup.createdAt)}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="delete-backup-confirm">
                        لل تأكيد، اكتب كلمة «{CONFIRM_WORD}»
                    </Label>
                    <Input
                        id="delete-backup-confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={CONFIRM_WORD}
                        autoComplete="off"
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={mutation.isPending}
                    >
                        إلغاء
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmValid || mutation.isPending}
                    >
                        <Trash2 className="me-2 h-4 w-4" />
                        {mutation.isPending ? 'جارٍ الحذف...' : 'حذف النسخة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
