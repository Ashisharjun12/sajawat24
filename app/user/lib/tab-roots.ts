import type { Href } from 'expo-router';

/** Root screen for each bottom tab (re-tap pops nested stacks here). */
export const TAB_ROOT_HREFS: Record<string, Href> = {
  index: '/(app)/' as Href,
  category: '/(app)/category' as Href,
  explore: '/(app)/explore' as Href,
  instant: '/(app)/instant' as Href,
  profile: '/(app)/profile' as Href,
};

export const BOTTOM_TAB_ROUTE_NAMES = new Set(Object.keys(TAB_ROOT_HREFS));

/** Tab routes that keep the bottom bar visible (hidden routes like checkout omit). */
export const TAB_BAR_VISIBLE_ROUTE_NAMES = new Set([
  ...BOTTOM_TAB_ROUTE_NAMES,
  'notifications',
]);
