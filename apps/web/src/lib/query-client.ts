import { QueryClient } from '@tanstack/react-query';
import { ApiClientError } from './api-client';

/**
 * ═══════════════════════════════════════════════════════════════
 * query-client — TanStack Query configuration.
 * ═══════════════════════════════════════════════════════════════
 *
 * - staleTime: 30s — البيانات لا تُعاد جلبها قبل 30 ثانية.
 * - retry: لا إعادة على 4xx (خطأ عميل).
 * - refetchOnWindowFocus: false — لتجنّب إزعاج المستخدم.
 * - refetchOnReconnect: true — إعادة عند عودة الاتصال.
 */

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                retry: (failureCount, error) => {
                    if (error instanceof ApiClientError) {
                        // لا نعيد المحاولة على أخطاء العميل
                        if (error.status >= 400 && error.status < 500) {
                            return false;
                        }
                    }
                    return failureCount < 1;
                },
            },
            mutations: {
                retry: false,
            },
        },
    });
}
