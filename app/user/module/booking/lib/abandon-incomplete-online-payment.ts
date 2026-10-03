import { cancelPendingOrder } from '@/api/orders.api';

/** Cancel unpaid order after user left or payment failed — allows a fresh checkout attempt. */
export async function abandonIncompleteOnlinePayment(orderId: string): Promise<void> {
  const id = orderId.trim();
  if (!id) return;
  try {
    await cancelPendingOrder(id);
  } catch {
    // Already cancelled or not pending — safe to continue checkout reset.
  }
}
