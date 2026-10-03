/**
 * formatFileSize — يحوّل عدد البايتات إلى نص مقروء.
 *
 * ⚠️ هذا ليس مبلغًا ماليًا — لا علاقة له بقواعد MoneyString.
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${Math.round(bytes / (1024 * 1024))} MB`;
    }

    return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
}
