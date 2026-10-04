import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../api/notifications';

/* تنبيهات تُحسب عند الطلب — تحديث كل 60 ثانية */
export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        refetchInterval: 60_000,
        staleTime: 45_000,
    });
}
