import { getOrderTracking, type OrderStatus } from '@/api/orders.api';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

export function trackingPollIntervalMs(status: OrderStatus | undefined): number | false {
  if (!status) return false;
  if (status === 'EN_ROUTE') return 8000;
  if (status === 'ON_SITE' || status === 'ASSIGNED') return 30000;
  return false;
}

export function useOrderTrackingQuery(
  orderId: string | null | undefined,
  orderStatus: OrderStatus | undefined,
  enabled = true,
) {
  const poll = trackingPollIntervalMs(orderStatus);
  return useQuery({
    queryKey: queryKeys.orderTracking(orderId ?? ''),
    enabled: Boolean(orderId) && enabled && Boolean(poll),
    queryFn: () => getOrderTracking(orderId!),
    refetchInterval: poll || false,
  });
}
