/**
 * ═══════════════════════════════════════════════════════════════
 * auth — Client-side auth helpers.
 * ═══════════════════════════════════════════════════════════════
 *
 * قواعد صارمة:
 *  - JWT مخزّن في HttpOnly Cookie (لا يُقرأ من JavaScript).
 *  - لا localStorage.setItem('token', ...).
 *  - لا sessionStorage.
 *  - CSRF token في الذاكرة فقط (انظر api-client).
 *  - الدوال هنا تُدير حالة الواجهة فقط (cache, redirects).
 *
 * AuthProvider الكامل سيُبنى في D8.
 */

// إعادة تصدير CSRF utilities من api-client (مصدر واحد للحقيقة).
export {
    getCsrfToken,
    setCsrfToken,
    clearCsrfToken,
    ensureCsrfToken,
} from './api-client';

/**
 * اسم Cookie الـ auth (HttpOnly).
 * لا يمكن قراءته من JavaScript — للتوثيق فقط.
 */
export const AUTH_COOKIE_NAME = 'prince_net_token';

/**
 * يُنبّه الواجهة أن الجلسة انتهت (401).
 * لا يحذف Cookie — الـ Backend هو من يفعل.
 * يُستخدم لمسح cache وإعادة التوجيه.
 */
export function notifySessionExpired(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('prince-net:session-expired'));
}

/**
 * هل الجلسة محتملة الوجود؟
 *
 * ملاحظة:
 *  - لا يمكن التحقق فعليًا من JWT (HttpOnly).
 *  - لا نستطيع قراءة أي cookie ذي صلة.
 *  - الدالة تعيد true دائمًا — لتشجيع استدعاء /auth/me.
 *
 * الفائدة:
 *  - تجنّب flicker في الصفحات العامة.
 *  - الـ Backend هو المرجع الحقيقي للحالة.
 *
 * @deprecated — لن تُستخدم في AuthProvider. أُبقيَت للتوافق.
 */
export function hasPotentialSession(): boolean {
    // لا يمكن معرفة الحالة بدون استدعاء /auth/me.
    // نُعيد true دائمًا لتفادي false negatives.
    return true;
}