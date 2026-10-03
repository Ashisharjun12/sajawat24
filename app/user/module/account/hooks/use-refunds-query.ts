import { listRefunds } from '@/api/refunds.api';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useRefundsQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.refunds(),
    queryFn: async () => {
      const data = await listRefunds({ page: 1, limit: 50 });
      return Array.isArray(data?.items) ? data.items : [];
    },
    staleTime: 30_000,
    ...options,
  });
}
