import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreBackup } from '../api/restore';

export function useRestoreBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => restoreBackup(id),
        onSuccess: () => {
            // استبدال كامل للبيانات → إفراغ cache كامل + إعادة تسجيل الدخول
            queryClient.clear();
            window.location.href = '/login';
        },
    });
}
