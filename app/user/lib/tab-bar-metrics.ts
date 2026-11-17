import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab row height inside the floating pill (icons + labels). `AppTabBar` uses this. */
export const TAB_BAR_CONTENT_HEIGHT = 62;

/** Gap above the floating pill (between screen content and the bar). */
export const TAB_BAR_FLOAT_TOP_GAP = 6;

/** Gap below the pill, added on top of the safe-area inset. */
export const TAB_BAR_FLOAT_BOTTOM_GAP = 8;

/** Side inset of the floating pill from the screen edges. */
export const TAB_BAR_FLOAT_SIDE_INSET = 12;

/** Hairline border around the pill (top + bottom). */
const TAB_BAR_BORDER = 2;

/**
 * Total bottom tab bar height, exactly as `AppTabBar` draws it: top gap + pill (border + row)
 * + bottom gap + safe-area inset. Used to dock things (the active-order card) right above the
 * bar without overlap.
 */
export function useAppTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return (
    TAB_BAR_FLOAT_TOP_GAP +
    TAB_BAR_BORDER +
    TAB_BAR_CONTENT_HEIGHT +
    TAB_BAR_FLOAT_BOTTOM_GAP +
    insets.bottom
  );
}
