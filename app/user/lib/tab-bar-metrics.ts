import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab row height (icons + labels). `AppTabBar` uses this, so overlays always line up. */
export const TAB_BAR_CONTENT_HEIGHT = 72;
/** Hairline top border on the bar. */
const TAB_BAR_BORDER = 1;

/**
 * Total bottom tab bar height, exactly as `AppTabBar` draws it: border + row + safe-area
 * inset. Used to dock things (the active-order card) right above the bar without overlap.
 */
export function useAppTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BORDER + TAB_BAR_CONTENT_HEIGHT + insets.bottom;
}
