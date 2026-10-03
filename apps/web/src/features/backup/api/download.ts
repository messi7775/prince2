import { ApiClientError } from '../../../lib/api-client';
import type { Backup } from '@prince-net/types';

/**
 * تنزيل ملف النسخة الاحتياطية إلى جهاز المستخدم.
 *
 * GET غير محمي بـ CSRF — الطلب يمر عبر نفس الأصل (Vite proxy)
 * مع cookies الجلسة، ثم يُحوَّل الـ response إلى blob ويُنزَّل.
 */
export async function downloadBackup(
    backup: Pick<Backup, 'id' | 'fileName'>,
): Promise<void> {
    const response = await fetch(
        `/api/v1/backups/${backup.id}/download`,
        { credentials: 'include' },
    );

    if (!response.ok) {
        let message = `فشل التنزيل (${response.status})`;
        let code = 'HTTP_ERROR';
        try {
            const payload = (await response.json()) as {
                message?: string;
                code?: string;
            };
            if (payload.message) message = payload.message;
            if (payload.code) code = payload.code;
        } catch {
            // الرد ليس JSON (مثلاً خطأ proxy) — نستخدم الرسالة الافتراضية
        }
        throw new ApiClientError(response.status, message, code);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backup.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
