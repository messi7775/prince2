import type {
    ApiResponse,
    PaginatedResponse,
    PaginationMeta,
} from '@prince-net/types';

/**
 * ═══════════════════════════════════════════════════════════════
 * api-client — Unified HTTP client for Prince Net API.
 * ═══════════════════════════════════════════════════════════════
 *
 * قواعد:
 *  - credentials: "include" إلزامي (HttpOnly Cookie).
 *  - لا JWT في localStorage/sessionStorage.
 *  - CSRF token يُخزَّن في JavaScript memory فقط.
 *    يُجلَب من GET /auth/csrf (lazy — عند أول mutation).
 *  - يُرسَل في header X-CSRF-Token على كل mutation.
 *  - إذا أعاد السيرفر 403 مع code=CSRF_INVALID:
 *      → إعادة المحاولة مرة واحدة بtoken جديد.
 *  - معالجة موحّدة للأخطاء مع ApiClientError.
 *  - 401 → إشارة للـ AuthProvider (يُدار في D8).
 *
 * ⚠️ مهم:
 *  - لا نقرأ CSRF من cookie (لأنه HttpOnly).
 *  - لا نستخدم localStorage ولا sessionStorage.
 *  - POST /auth/login محمي بـ CSRF — لا يوجد استثناء.
 */

const API_BASE_URL: string =
    import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const CSRF_HEADER_NAME = 'x-csrf-token';

// ───────────────────────────────────────────────────────────────
// CSRF Memory Token (module-level)
// ───────────────────────────────────────────────────────────────
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string> | null = null;

/**
 * يعيد CSRF token الحالي من الذاكرة (أو null).
 */
export function getCsrfToken(): string | null {
    return csrfToken;
}

/**
 * يضبط CSRF token يدويًا (نادرًا ما يُستخدم).
 */
export function setCsrfToken(token: string | null): void {
    csrfToken = token;
}

/**
 * يمسح CSRF token من الذاكرة.
 * يُستخدم عند logout أو عند رفض السيرفر.
 */
export function clearCsrfToken(): void {
    csrfToken = null;
    csrfFetchPromise = null;
}

// ───────────────────────────────────────────────────────────────
// ApiClientError
// ───────────────────────────────────────────────────────────────
export class ApiClientError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly details?: Record<string, unknown>;

    constructor(
        status: number,
        message: string,
        code: string,
        details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'ApiClientError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
    /**
     * داخلي فقط — يُستخدم لتجنّب حلقة لا نهائية عند جلب CSRF token.
     * لا تُمرّره يدويًا.
     */
    _skipCsrf?: boolean;
}

// ───────────────────────────────────────────────────────────────
// URL builder
// ───────────────────────────────────────────────────────────────
function buildUrl(path: string, query?: RequestOptions['query']): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const base = API_BASE_URL.endsWith('/')
        ? API_BASE_URL.slice(0, -1)
        : API_BASE_URL;

    // ⚡ يدعم الوضعين (مطلق / نسبي) بنفس المنطق:
    //    fullUrl = base + "/" + cleanPath
    let fullUrl = `${base}/${cleanPath}`;

    // إضافة query string
    if (query) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        }
        const qs = params.toString();
        if (qs) fullUrl += `?${qs}`;
    }

    return fullUrl;
}

// ───────────────────────────────────────────────────────────────
// Raw fetch (no CSRF, no retry)
// ───────────────────────────────────────────────────────────────
interface RawResponse<T> {
    status: number;
    ok: boolean;
    data: T | null;
    errorPayload: {
        message?: string;
        code?: string;
        details?: Record<string, unknown>;
    } | null;
}

async function rawFetch<T>(
    url: string,
    init: RequestInit,
): Promise<RawResponse<T>> {
    const response = await fetch(url, init);

    let payload: unknown = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        return {
            status: response.status,
            ok: false,
            data: null,
            errorPayload: payload as RawResponse<T>['errorPayload'],
        };
    }

    return {
        status: response.status,
        ok: true,
        data: payload as T,
        errorPayload: null,
    };
}

// ───────────────────────────────────────────────────────────────
// CSRF token fetcher (lazy + deduplicated)
// ───────────────────────────────────────────────────────────────
async function fetchCsrfToken(): Promise<string> {
    const result = await rawFetch<{ csrfToken: string }>(
        buildUrl('/auth/csrf'),
        {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'include',
        },
    );

    if (!result.ok || !result.data?.csrfToken) {
        const err = result.errorPayload;
        throw new ApiClientError(
            result.status,
            err?.message ?? 'فشل جلب CSRF token',
            err?.code ?? 'CSRF_FETCH_FAILED',
            err?.details,
        );
    }

    csrfToken = result.data.csrfToken;
    return csrfToken;
}

/**
 * يعيد CSRF token من الذاكرة أو يجلبه (lazy).
 * يُمنع تكرار الطلبات المتزامنة عبر csrfFetchPromise.
 */
export async function ensureCsrfToken(): Promise<string> {
    if (csrfToken) return csrfToken;

    if (!csrfFetchPromise) {
        csrfFetchPromise = fetchCsrfToken().finally(() => {
            csrfFetchPromise = null;
        });
    }

    return csrfFetchPromise;
}

// ───────────────────────────────────────────────────────────────
// Main request (with CSRF + retry)
// ───────────────────────────────────────────────────────────────
async function request<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const {
        method = 'GET',
        body,
        query,
        signal,
        _skipCsrf = false,
    } = options;

    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const isMutating = method !== 'GET';

    // CSRF token على mutations
    if (isMutating && !_skipCsrf) {
        const token = await ensureCsrfToken();
        headers[CSRF_HEADER_NAME] = token;
    }

    const url = buildUrl(path, query);
    const init: RequestInit = {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
    };

    let result = await rawFetch<T>(url, init);

    // Retry مرة واحدة إذا رفض السيرفر CSRF
    if (
        !result.ok &&
        result.status === 403 &&
        result.errorPayload?.code === 'CSRF_INVALID' &&
        isMutating &&
        !_skipCsrf
    ) {
        clearCsrfToken();
        const freshToken = await ensureCsrfToken();

        const retryHeaders = {
            ...headers,
            [CSRF_HEADER_NAME]: freshToken,
        };

        result = await rawFetch<T>(url, {
            ...init,
            headers: retryHeaders,
        });
    }

    if (!result.ok) {
        const err = result.errorPayload;
        throw new ApiClientError(
            result.status,
            err?.message ?? `Request failed with status ${result.status}`,
            err?.code ?? 'HTTP_ERROR',
            err?.details,
        );
    }

    return result.data as T;
}

// ───────────────────────────────────────────────────────────────
// Public helpers
// ───────────────────────────────────────────────────────────────
async function get<T>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body' | '_skipCsrf'>,
): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
}

async function post<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body' | '_skipCsrf'>,
): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
}

async function patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body' | '_skipCsrf'>,
): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
}

async function del<T>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body' | '_skipCsrf'>,
): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
}

/**
 * Paginated helper — يعيد { data, meta }.
 */
export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

async function getPaginated<T>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body' | '_skipCsrf'>,
): Promise<PaginatedResult<T>> {
    const response = await request<PaginatedResponse<T>>(path, {
        ...options,
        method: 'GET',
    });
    return { data: response.data, meta: response.meta };
}

export const apiClient = {
    get,
    post,
    patch,
    delete: del,
    getPaginated,
    // CSRF utilities
    getCsrfToken,
    setCsrfToken,
    clearCsrfToken,
    ensureCsrfToken,
    ApiClientError,
};

export type { ApiResponse };