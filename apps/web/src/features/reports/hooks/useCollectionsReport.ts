import { useQuery } from '@tanstack/react-query';
import { fetchCollectionsReport } from '../api/collections';

interface UseCollectionsReportParams {
  dateFrom?: string;
  dateTo?: string;
}

export function useCollectionsReport(params: UseCollectionsReportParams) {
  return useQuery({
    queryKey: ['reports', 'collections', params],
    queryFn: () => fetchCollectionsReport(params),
    staleTime: 60_000,
  });
}
