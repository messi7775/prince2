import type { ISODateString } from '@prince-net/types';

/**
 * ═══════════════════════════════════════════════════════════════
 * format — Date & number formatting helpers.
 * ═══════════════════════════════════════════════════════════════
 *
 * - للعرض فقط.
 * - لا تُستخدم لمعالجة أموال أو عمليات مالية.
 */

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * "2026-09-29T10:30:00Z" → "29 سبتمبر 2026"
 */
export function formatDate(value: ISODateString | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return dateFormatter.format(d);
}

/**
 * "2026-09-29T10:30:00Z" → "29 سبتمبر 2026، 01:30 م"
 */
export function formatDateTime(value: ISODateString | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return dateTimeFormatter.format(d);
}

/**
 * "2026-09-29T10:30:00Z" → "29/09/2026"
 */
export function formatShortDate(value: ISODateString | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return shortDateFormatter.format(d);
}

/**
 * عرض أعداد صحيحة (كمية، عدد) — ليس للمال.
 */
export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return numberFormatter.format(value);
}
