import type { CustomerUser } from '@/lib/auth.types';
import { type Href, router } from 'expo-router';
import { Alert } from 'react-native';

export function openCartCheckout(user: CustomerUser | null, itemCount: number) {
  if (!user) {
    router.push('/(onboarding)/login' as Href);
    return false;
  }
  if (itemCount <= 0) {
    Alert.alert('Your bag is empty', 'Add a setup from the catalog to continue.');
    return false;
  }
  router.push('/(app)/checkout' as Href);
  return true;
}

/** After add-to-bag — skip stale React Query empty cart; go straight to confirm booking. */
export function goToCheckoutAfterAdd(user: CustomerUser | null) {
  if (!user) {
    router.push('/(onboarding)/login' as Href);
    return;
  }
  router.push('/(app)/checkout' as Href);
}
