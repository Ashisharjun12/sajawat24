import type { OrderStatus, PublicOrder } from '@/api/orders.api';

/** Map-first layout only while the decorator is traveling to the customer. */
const MAP_TRACKING_STATUSES = new Set<OrderStatus>(['EN_ROUTE']);

export function isOrderTrackingLayout(order: PublicOrder | undefined): boolean {
  if (!order) return false;
  return MAP_TRACKING_STATUSES.has(order.status);
}
