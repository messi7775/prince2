import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeBackup } from '../api/remove';

export function useDeleteBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        },
    });
}
