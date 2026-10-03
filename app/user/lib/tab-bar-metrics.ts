import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab row: paddingTop 8 + icon 24 + gap + label + pb-1 — keep in sync with `AppTabBar`. */
const TAB_BAR_INNER_HEIGHT = 51;

/** Total bottom tab bar height (for overlays outside tab screens). */
export function useAppTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6);
  return TAB_BAR_INNER_HEIGHT + paddingBottom;
}
