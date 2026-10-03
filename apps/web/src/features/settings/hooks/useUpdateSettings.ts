import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateSettingsInput } from '@prince-net/validation';
import { updateSettings } from '../api/update';

export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
    });
}
