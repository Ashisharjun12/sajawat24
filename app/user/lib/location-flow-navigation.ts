import { goBackOneScreen, navigateBackOrHome } from '@/lib/navigate-back';
import { useLocationFlowStore } from '@/store/location-flow.store';
import { type Href, router } from 'expo-router';

const CHECKOUT_HREF = '/(app)/checkout' as Href;

export function finishLocationFlow() {
  const { returnTarget: target, returnHref } = useLocationFlowStore.getState();
  useLocationFlowStore.getState().clearReturn();
  if (target === 'checkout') {
    router.replace(CHECKOUT_HREF);
    return;
  }
  if (returnHref) {
    // Navigate (not push) so the existing screen, e.g. the product page, is shown again.
    router.navigate(returnHref);
    return;
  }
  navigateBackOrHome();
}

export function cancelLocationFlowStep() {
  const target = useLocationFlowStore.getState().returnTarget;
  if (target === 'checkout') {
    goBackOneScreen({ fallbackHref: CHECKOUT_HREF });
    return;
  }
  navigateBackOrHome();
}
