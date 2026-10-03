import {
  getOrder,
  listOrders,
  type OrderListBucket,
  type OrderStatus,
  type PaginatedOrders,
} from '@/api/orders.api';
import { queryKeys } from '@/lib/query-keys';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

const ACTIVE_TRIP: OrderStatus[] = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'];

export function isActiveTripStatus(status: OrderStatus | undefined): boolean {
  return status != null && ACTIVE_TRIP.includes(status);
}

export function orderDetailPollIntervalMs(status: OrderStatus | undefined): number | false {
  if (!status || !isActiveTripStatus(status)) return false;
  if (status === 'EN_ROUTE') return 8000;
  if (status === 'ASSIGNED') return 10000;
  return 30000;
}

const PAGE_SIZE = 20;

export function useOrdersInfiniteQuery(bucket: OrderListBucket) {
  return useInfiniteQuery({
    queryKey: queryKeys.ordersInfinite(bucket),
    queryFn: ({ pageParam }) =>
      listOrders({ page: pageParam, limit: PAGE_SIZE, bucket }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedOrders) => {
      const next = lastPage.page + 1;
      if (lastPage.page * lastPage.limit >= lastPage.total) return undefined;
      return next;
    },
  });
}

export function useOrderDetailQuery(orderId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.orderDetail(orderId ?? ''),
    enabled: Boolean(orderId),
    queryFn: () => getOrder(orderId!),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return orderDetailPollIntervalMs(status) || false;
    },
  });
}
