import { type Href, router } from 'expo-router';

/** Navigate to in-app booking chat for an order (Expo Router dynamic segment). */
export function openOrderBookingChat(orderId: string) {
  const id = orderId.trim();
  if (!id) return;
  router.push(`/(app)/profile/orders/${id}/chat` as Href);
}
