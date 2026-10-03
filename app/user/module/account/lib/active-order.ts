import type { OrderStatus, PublicOrderSummary } from '@/api/orders.api';

const HOME_BAR_STATUSES = new Set<OrderStatus>(['ASSIGNED', 'EN_ROUTE', 'ON_SITE']);

const STATUS_PRIORITY: Record<string, number> = {
  ON_SITE: 3,
  EN_ROUTE: 2,
  ASSIGNED: 1,
};

export function isHomeActiveOrderStatus(status: OrderStatus): boolean {
  return HOME_BAR_STATUSES.has(status);
}

/** Pick one order for the Home sticky bar (highest trip priority, then nearest slot). */
export function pickPrimaryActiveOrder(items: PublicOrderSummary[]): PublicOrderSummary | null {
  const candidates = items.filter((o) => isHomeActiveOrderStatus(o.status));
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 0;
    const pb = STATUS_PRIORITY[b.status] ?? 0;
    if (pb !== pa) return pb - pa;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  return candidates[0];
}

export function countOtherActiveOrders(items: PublicOrderSummary[], primaryId: string): number {
  return items.filter((o) => isHomeActiveOrderStatus(o.status) && o.id !== primaryId).length;
}

export function homeActiveOrderTitle(status: OrderStatus): string {
  switch (status) {
    case 'ON_SITE':
      return 'Decorator has arrived';
    case 'EN_ROUTE':
      return 'Your order is on the way';
    case 'ASSIGNED':
      return 'Decorator assigned';
    default:
      return 'Order update';
  }
}
