import { apiClient } from '../../../lib/api-client';
import type { SearchResponse } from '@prince-net/types';

export async function search(q: string): Promise<SearchResponse> {
  return apiClient.get<SearchResponse>('/search', {
    query: { q },
  });
}
