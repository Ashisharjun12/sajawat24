import { listOrders } from '@/api/orders.api';
import { pickPrimaryActiveOrder, countOtherActiveOrders } from '@/module/account/lib/active-order';
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

  const primary = useMemo(
    () => pickPrimaryActiveOrder(query.data?.items ?? []),
    [query.data?.items],
  );

  const moreCount = useMemo(
    () => (primary ? countOtherActiveOrders(query.data?.items ?? [], primary.id) : 0),
    [primary, query.data?.items],
  );

  return {
    primary,
    moreCount,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
