import { useActiveOrderForHome } from '@/module/account/hooks/use-active-order-for-home';
import { HOME_ACTIVE_ORDER_BAR_HEIGHT } from '@/module/home/components/HomeActiveOrderBar';
import { useAuthStore } from '@/store/auth.store';
import { useSegments } from 'expo-router';

/** Bottom tabs that show the docked active-order card (not Profile). */
export function useIsMainTabWithActiveOrderBar(): boolean {
  const segments = useSegments();
  if (segments[0] !== '(app)') return false;
  const route = segments[1];
  if (route === undefined) return true;
  return route === 'category' || route === 'explore' || route === 'instant';
}

export function useActiveOrderScrollPaddingBottom(baseBottom: number): number {
  const onTab = useIsMainTabWithActiveOrderBar();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { primary } = useActiveOrderForHome(onTab && Boolean(accessToken));
  if (!onTab || !primary) return baseBottom;
  return baseBottom + HOME_ACTIVE_ORDER_BAR_HEIGHT;
}
