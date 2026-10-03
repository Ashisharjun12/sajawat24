import { useCheckoutStore } from '@/store/checkout.store';
import { type Href, router } from 'expo-router';

export function navigateToBookingConfirmed(orderId: string) {
  const store = useCheckoutStore.getState();
  store.setSuppressEmptyCartExit(true);
  store.setConfirmedOrderId(orderId);
  router.replace(`/(app)/checkout/success/${encodeURIComponent(orderId)}` as Href);
}
