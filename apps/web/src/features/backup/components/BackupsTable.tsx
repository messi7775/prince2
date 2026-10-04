import { Database, Download, RotateCcw, Trash2 } from 'lucide-react';
import type { Backup } from '@prince-net/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { formatDateTime } from '../../../lib/format';
import { formatFileSize } from '../../../lib/file-size';

interface BackupsTableProps {
    data: Backup[];
    onRestore: (backup: Backup) => void;
    onExport: (backup: Backup) => void;
    onDelete: (backup: Backup) => void;
}

function shortChecksum(checksum: string): string {
    return checksum.slice(0, 12);
}

export function BackupsTable({
    data,
    onRestore,
    onExport,
    onDelete,
}: BackupsTableProps) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={Database}
                title="لا توجد نسخ احتياطية"
                description="ابدأ بإنشاء نسخة جديدة"
                className="border-0 bg-transparent"
            />
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>اسم الملف</TableHead>
                        <TableHead className="hidden sm:table-cell">
                            الحجم
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            عدد السجلات
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                            Checksum
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                            التاريخ
                        </TableHead>
                        <TableHead className="w-56">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((backup) => (
                        <TableRow key={backup.id}>
                            <TableCell className="text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span dir="ltr" className="sm:truncate sm:max-w-[280px] break-words ltr">
                                        {backup.fileName}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell num text-sm">
                                {formatFileSize(backup.sizeBytes)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell num text-sm">
                                {backup.recordCount}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell num text-xs text-muted-foreground">
                                {shortChecksum(backup.checksum)}…
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm whitespace-nowrap">
                                {formatDateTime(backup.createdAt)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRestore(backup)}
                                    >
                                        <RotateCcw className="me-1 h-3.5 w-3.5" />
                                        استعادة
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onExport(backup)}
                                    >
                                        <Download className="me-1 h-3.5 w-3.5" />
                                        تصدير إلى الجهاز
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(backup)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="me-1 h-3.5 w-3.5" />
                                        حذف النسخة
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
