import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeAllBackups } from '../api/remove';

export function useDeleteAllBackups() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeAllBackups,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        },
    });
}
