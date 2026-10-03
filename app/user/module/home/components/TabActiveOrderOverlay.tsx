import { useAppTabBarHeight } from '@/lib/tab-bar-metrics';
import { HomeActiveOrderBar } from '@/module/home/components/HomeActiveOrderBar';
import { useIsMainTabWithActiveOrderBar } from '@/module/home/hooks/use-tab-active-order-bar';
import { useAuthStore } from '@/store/auth.store';
import { View } from 'react-native';

/** Docked “your order” card on Home, Category, Explore, and Instant. */
export function TabActiveOrderOverlay() {
  const onTab = useIsMainTabWithActiveOrderBar();
  const accessToken = useAuthStore((s) => s.accessToken);
  const tabBarHeight = useAppTabBarHeight();

  if (!onTab) return null;

  return (
    <View
      className="absolute left-0 right-0 z-20"
      style={{ bottom: tabBarHeight }}
      pointerEvents="box-none">
      <HomeActiveOrderBar enabled={Boolean(accessToken)} />
    </View>
  );
}
