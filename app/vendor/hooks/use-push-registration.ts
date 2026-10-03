import { syncPushRegistration } from '@/lib/push-registration';
import { useAuthStore } from '@/store/auth.store';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export { clearPushRegistration, resetCachedPushToken, syncPushRegistration } from '@/lib/push-registration';

export function usePushRegistration() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorStatus = useAuthStore((s) => s.user?.vendor?.onboardingStatus ?? null);
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken || !userId || vendorStatus !== 'ACTIVE') {
      syncedRef.current = null;
      return;
    }

    function register() {
      const key = `${userId}:${accessToken}`;
      if (syncedRef.current === key) {
        return;
      }

      syncedRef.current = key;
      void syncPushRegistration(accessToken, userId).catch(() => {
        syncedRef.current = null;
      });
    }

    register();

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        syncedRef.current = null;
        register();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [accessToken, userId, vendorStatus]);
}
