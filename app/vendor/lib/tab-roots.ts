import type { Href } from 'expo-router';

/** Root screen for each bottom tab (tab tap always lands here). */
export const TAB_ROOT_HREFS: Record<string, Href> = {
  index: '/(app)' as Href,
  bookings: '/(app)/bookings' as Href,
  messages: '/(app)/messages' as Href,
  payouts: '/(app)/payouts' as Href,
  profile: '/(app)/profile' as Href,
};

export function visibleTabRouteNames(isFieldShell: boolean): string[] {
  if (isFieldShell) return ['index', 'bookings', 'messages', 'profile'];
  return ['index', 'bookings', 'payouts', 'profile'];
}

export function tabLabel(routeName: string, isFieldShell: boolean): string {
  switch (routeName) {
    case 'index':
      return isFieldShell ? 'Today' : 'Home';
    case 'bookings':
      return isFieldShell ? 'My jobs' : 'Bookings';
    case 'messages':
      return 'Messages';
    case 'payouts':
      return 'Wallet';
    case 'profile':
      return 'Profile';
    default:
      return routeName;
  }
}

/** Which bottom tab should appear selected for the current path. */
export function tabNameForPathname(pathname: string): string {
  if (/\/bookings(\/|$)/.test(pathname)) return 'bookings';
  if (pathname.includes('/messages')) return 'messages';
  if (
    pathname.includes('/payouts') ||
    pathname.includes('bank-account') ||
    pathname.includes('upi-id')
  ) {
    return 'payouts';
  }
  if (
    pathname.includes('/profile') ||
    pathname.includes('edit-profile') ||
    pathname.includes('app-permissions') ||
    pathname.includes('app-theme') ||
    pathname.includes('/notifications') ||
    pathname.includes('help-support') ||
    /\/support(\/|$)/.test(pathname) ||
    pathname.includes('/team')
  ) {
    return 'profile';
  }
  return 'index';
}

export function shouldHideVendorTabBar(pathname: string): boolean {
  if (pathname.includes('enable-notifications') || pathname.includes('enable-location')) {
    return true;
  }
  if (/\/bookings\/[^/]+/.test(pathname)) return true;
  if (pathname.includes('help-support')) return true;
  if (/\/support(\/|$)/.test(pathname)) return true;
  return false;
}
