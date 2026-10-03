import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBackup } from '../api/create';

export function useCreateBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        },
    });
}
