import { useQuery } from '@tanstack/react-query';
import { listBackups } from '../api/list';

export function useBackups() {
    return useQuery({
        queryKey: ['backups'],
        queryFn: listBackups,
        staleTime: 30_000,
    });
}
