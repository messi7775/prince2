import { useMemo, useState } from 'react';
import { Check, Clipboard, Clock3, Database, Globe2, Monitor, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { ErrorState } from '../../../components/ui/error-state';
import { Separator } from '../../../components/ui/separator';
import { useAuditLog } from '../hooks/useAuditLog';
import { formatDateTime } from '../../../lib/format';
import { formatAuditValue, getAuditActionLabel, getAuditActionTone, getAuditFieldLabel, getEntityTypeLabel } from '../../../lib/audit-actions';

interface AuditLogDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditLogId: string | null;
}

type CopyButtonProps = { value: string; label?: string };

function CopyButton({ value, label = 'نسخ' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  return <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={copy}>{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? 'تم النسخ' : label}</Button>;
}

function MetaItem({ icon: Icon, label, value, mono = false, copyable = false }: { icon: LucideIcon; label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className={`flex items-center justify-between gap-2 text-sm font-medium ${mono ? 'break-all font-mono text-xs' : ''}`}>
        <span dir="ltr" className="ltr">{value || '—'}</span>
        {copyable && value && value !== '—' ? <CopyButton value={value} /> : null}
      </div>
    </div>
  );
}

function ValueSection({ title, values, tone }: { title: string; values: Record<string, unknown> | null; tone: 'old' | 'new' }) {
  if (!values || Object.keys(values).length === 0) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <CopyButton value={JSON.stringify(values, null, 2)} label="نسخ JSON" />
      </div>
      <div className={`overflow-hidden rounded-lg border ${tone === 'new' ? 'border-primary/20 bg-primary/[0.03]' : 'bg-muted/20'}`}>
        <div className="divide-y">
          {Object.entries(values).map(([key, value]) => (
            <div key={key} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[180px_1fr] sm:items-center">
              <div className="text-xs font-medium text-muted-foreground">{getAuditFieldLabel(key)}</div>
              <div className="break-words text-sm" dir={typeof value === 'string' && value.length > 24 ? 'ltr' : undefined}>
                {typeof value === 'object' && value !== null ? <pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs" dir="ltr">{formatAuditValue(value, key)}</pre> : formatAuditValue(value, key)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AuditLogDetailsDialog({ open, onOpenChange, auditLogId }: AuditLogDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = useAuditLog(auditLogId);
  const changes = useMemo(() => {
    if (!data?.oldValues || !data.newValues) return [];
    const keys = new Set([...Object.keys(data.oldValues), ...Object.keys(data.newValues)]);
    return [...keys].filter((key) => JSON.stringify(data.oldValues?.[key]) !== JSON.stringify(data.newValues?.[key]));
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="border-b pb-4">
          {data ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-primary" />تفاصيل العملية</DialogTitle>
                <DialogDescription className="mt-1">معلومات كاملة ومرتبة عن سجل التدقيق</DialogDescription>
              </div>
              <Badge variant={getAuditActionTone(data.action)} className="text-sm">{getAuditActionLabel(data.action)}</Badge>
            </div>
          ) : (
            <><DialogTitle>تفاصيل العملية</DialogTitle><DialogDescription>معلومات كاملة عن السجل</DialogDescription></>
          )}
        </DialogHeader>

        {isLoading ? <LoadingState /> : isError || !data ? (
          <ErrorState title="تعذّر تحميل التفاصيل" message={error instanceof Error ? error.message : 'حدث خطأ'} onRetry={() => refetch()} />
        ) : (
          <div className="space-y-5 py-1">
            <section className="grid gap-3 sm:grid-cols-2">
              <MetaItem icon={Clock3} label="التاريخ والوقت" value={formatDateTime(data.createdAt)} />
              <MetaItem icon={UserRound} label="المستخدم" value={data.userEmail ?? '—'} />
              <MetaItem icon={Database} label="نوع السجل" value={getEntityTypeLabel(data.entityType)} />
              <MetaItem icon={Database} label="معرّف السجل" value={data.entityId ?? '—'} mono copyable />
              <MetaItem icon={Globe2} label="عنوان IP" value={data.ipAddress ?? '—'} mono copyable />
              <MetaItem icon={Monitor} label="المتصفح / الجهاز" value={data.userAgent ?? '—'} mono />
            </section>

            <Separator />

            {changes.length > 0 ? (
              <section className="space-y-2">
                <div className="flex items-center gap-2"><h3 className="text-sm font-semibold">التغييرات</h3><Badge variant="secondary">{changes.length} حقول</Badge></div>
                <div className="overflow-hidden rounded-lg border">
                  {changes.map((key) => (
                    <div key={key} className="grid gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[170px_1fr_1fr] sm:items-center">
                      <div className="text-xs font-semibold text-muted-foreground">{getAuditFieldLabel(key)}</div>
                      <div><div className="mb-1 text-[11px] text-muted-foreground">قبل</div><div className="rounded bg-muted/60 px-2 py-1.5 text-sm">{formatAuditValue(data.oldValues?.[key], key)}</div></div>
                      <div><div className="mb-1 text-[11px] text-primary">بعد</div><div className="rounded bg-primary/[0.06] px-2 py-1.5 text-sm font-medium">{formatAuditValue(data.newValues?.[key], key)}</div></div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <ValueSection title={data.oldValues && data.newValues ? 'القيم السابقة' : 'البيانات المسجلة'} values={data.oldValues} tone="old" />
            <ValueSection title={data.oldValues && data.newValues ? 'القيم الجديدة' : data.newValues ? 'البيانات الجديدة' : 'البيانات'} values={data.newValues} tone="new" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
