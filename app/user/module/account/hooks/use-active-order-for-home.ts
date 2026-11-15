import { listOrders } from '@/api/orders.api';
import { sortActiveOrders } from '@/module/account/lib/active-order';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const POLL_MS = 45_000;

export function useActiveOrderForHome(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const query = useQuery({
    queryKey: queryKeys.activeOrdersHome(),
    enabled: enabled && Boolean(accessToken),
    queryFn: () => listOrders({ bucket: 'upcoming', page: 1, limit: 10 }),
    refetchInterval: enabled ? POLL_MS : false,
    staleTime: 15_000,
  });

  /** Every active trip, most urgent first. */
  const activeOrders = useMemo(
    () => sortActiveOrders(query.data?.items ?? []),
    [query.data?.items],
  );

  const primary = activeOrders[0] ?? null;
  const moreCount = Math.max(activeOrders.length - 1, 0);

  return {
    activeOrders,
    primary,
    moreCount,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
