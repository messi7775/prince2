import { apiClient } from '../../../lib/api-client';
import type { NotificationsResponse } from '@prince-net/types';

export async function getNotifications(): Promise<NotificationsResponse> {
    return apiClient.get<NotificationsResponse>('/notifications');
}
