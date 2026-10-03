import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
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
import { useDeleteAllBackups } from '../hooks/useDeleteAllBackups';
import { ApiClientError } from '../../../lib/api-client';

const CONFIRM_WORD = 'حذف الكل';

interface DeleteAllBackupsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    count: number;
}

export function DeleteAllBackupsDialog({
    open,
    onOpenChange,
    count,
}: DeleteAllBackupsDialogProps) {
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState('');
    const mutation = useDeleteAllBackups();

    useEffect(() => {
        if (open) {
            setConfirmText('');
        }
    }, [open]);

    const isConfirmValid = confirmText.trim() === CONFIRM_WORD;

    const handleDeleteAll = async () => {
        if (!isConfirmValid) return;

        try {
            const deletedCount = await mutation.mutateAsync();
            onOpenChange(false);
            toast({
                title: 'تم حذف جميع النسخ',
                description: `عدد النسخ المحذوفة: ${deletedCount}`,
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
                        حذف جميع النسخ الاحتياطية
                    </DialogTitle>
                    <DialogDescription>
                        سيتم حذف جميع ملفات النسخ الاحتياطية وسجلاتها من
                        السيرفر نهائيًا، ولا يمكن التراجع عن هذه العملية.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">
                        سيتم حذف {count} نسخة احتياطية (الملفات والسجلات
                        معًا).
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="delete-all-backups-confirm">
                        لل تأكيد، اكتب كلمة «{CONFIRM_WORD}»
                    </Label>
                    <Input
                        id="delete-all-backups-confirm"
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
                        onClick={handleDeleteAll}
                        disabled={!isConfirmValid || mutation.isPending}
                    >
                        <Trash2 className="me-2 h-4 w-4" />
                        {mutation.isPending
                            ? 'جارٍ الحذف...'
                            : 'حذف جميع النسخ'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
