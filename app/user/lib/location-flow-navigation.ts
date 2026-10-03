import { goBackOneScreen, navigateBackOrHome } from '@/lib/navigate-back';
import { useLocationFlowStore } from '@/store/location-flow.store';
import { type Href, router } from 'expo-router';

const CHECKOUT_HREF = '/(app)/checkout' as Href;

export function finishLocationFlow() {
  const target = useLocationFlowStore.getState().returnTarget;
  useLocationFlowStore.getState().clearReturn();
  if (target === 'checkout') {
    router.replace(CHECKOUT_HREF);
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
