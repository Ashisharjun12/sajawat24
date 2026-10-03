import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { useAuthStore } from '@/store/auth.store';
import { usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function isNativePlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function usePermissionsSetupPrompt() {
  const vendorStatus = useAuthStore((s) => s.user?.vendor?.onboardingStatus ?? null);
  const pathname = usePathname();

  const setupCompleted = usePermissionsSetupStore((s) => s.setupCompleted);
  const locationStepDone = usePermissionsSetupStore((s) => s.locationStepDone);
  const notificationStepDone = usePermissionsSetupStore((s) => s.notificationStepDone);
  const hydrate = usePermissionsSetupStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate, pathname, vendorStatus]);

  const isLoading =
    setupCompleted === null || locationStepDone === null || notificationStepDone === null;

  const onSetupScreen =
    pathname.includes('enable-location') || pathname.includes('enable-notifications');

  let pendingRoute: Href | null = null;

  if (
    vendorStatus === 'ACTIVE' &&
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
