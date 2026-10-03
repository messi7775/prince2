import { useQuery } from '@tanstack/react-query';
import { fetchLinesReport } from '../api/lines';

export function useLinesReport() {
  return useQuery({
    queryKey: ['reports', 'lines'],
    queryFn: fetchLinesReport,
    staleTime: 60_000,
  });
}
