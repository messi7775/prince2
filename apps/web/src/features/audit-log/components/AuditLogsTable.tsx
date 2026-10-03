import { Eye, FileSearch } from 'lucide-react';
import type { AuditLog } from '@prince-net/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Pagination } from '../../../components/ui/pagination';
import { formatDateTime } from '../../../lib/format';
import { getAuditActionLabel, getAuditActionTone, getEntityTypeLabel } from '../../../lib/audit-actions';

interface AuditLogsTableProps {
  data: AuditLog[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewDetails: (log: AuditLog) => void;
}

export function AuditLogsTable({ data, page, totalPages, onPageChange, onViewDetails }: AuditLogsTableProps) {
  if (data.length === 0) {
    return <EmptyState icon={FileSearch} title="لا توجد سجلات" description="لم يتم العثور على سجلات تطابق الفلاتر الحالية" />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>التاريخ والوقت</TableHead>
              <TableHead>العملية</TableHead>
              <TableHead>نوع السجل</TableHead>
              <TableHead className="hidden sm:table-cell">المستخدم</TableHead>
              <TableHead className="hidden lg:table-cell">IP</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((log) => (
              <TableRow key={log.id} className="group cursor-pointer" onClick={() => onViewDetails(log)}>
                <TableCell className="whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={getAuditActionTone(log.action)}>{getAuditActionLabel(log.action)}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">{getEntityTypeLabel(log.entityType)}</TableCell>
                <TableCell className="hidden max-w-[220px] truncate text-sm sm:table-cell">{log.userEmail ?? '—'}</TableCell>
                <TableCell className="hidden text-xs num lg:table-cell">{log.ipAddress ?? '—'}</TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); onViewDetails(log); }} aria-label="عرض التفاصيل">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  );
}
