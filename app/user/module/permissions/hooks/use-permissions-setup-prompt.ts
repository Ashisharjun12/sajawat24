import { isNativePlatform } from '@/module/permissions/lib/platform-permissions';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect } from 'react';

/** After login: full-screen location step, then notifications (vendor-style). */
export function usePermissionsSetupPrompt() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const isLoggedIn = Boolean(accessToken && user);

  const setupCompleted = usePermissionsSetupStore((s) => s.setupCompleted);
  const locationStepDone = usePermissionsSetupStore((s) => s.locationStepDone);
  const notificationStepDone = usePermissionsSetupStore((s) => s.notificationStepDone);
  const hydrate = usePermissionsSetupStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate, pathname, accessToken, user?.id]);

  const isLoading =
    setupCompleted === null || locationStepDone === null || notificationStepDone === null;

  let pendingRoute: Href | null = null;

  const onSetupScreen =
    pathname.includes('enable-location') || pathname.includes('enable-notifications');

  if (
    isLoggedIn &&
    isNativePlatform() &&
    setupCompleted === false &&
    !onSetupScreen
  ) {
    if (locationStepDone === false) {
      pendingRoute = '/(app)/enable-location' as Href;
    } else if (notificationStepDone === false) {
      pendingRoute = '/(app)/enable-notifications' as Href;
    }
  }

  return {
    pendingRoute,
    isLoading,
    reload: hydrate,
  };
}
