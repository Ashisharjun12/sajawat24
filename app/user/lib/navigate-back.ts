import type { Href } from 'expo-router';
import { router } from 'expo-router';

const APP_HOME_HREF = '/(app)' as Href;

export type GoBackOptions = {
  /** Used when there is no history entry to pop. */
  fallbackHref?: Href;
  /** When true, replace with app home if back is unavailable (location flows, etc.). */
  orHome?: boolean;
};

/** Pop one screen when possible; optional fallback — does not jump home unless `orHome`. */
export function goBackOneScreen(options?: GoBackOptions) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (options?.fallbackHref) {
    router.replace(options.fallbackHref);
    return;
  }
  if (options?.orHome) {
    router.replace(APP_HOME_HREF);
  }
}

/** Back one screen, or home when there is no stack (avoids GO_BACK warning). */
export function navigateBackOrHome() {
  goBackOneScreen({ orHome: true });
}

export function navigateToAppHome() {
  router.replace(APP_HOME_HREF);
}
