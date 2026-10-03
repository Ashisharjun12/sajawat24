import { registerPlatformAccessPausedHandler } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import { Href, router, usePathname } from 'expo-router';
import { useEffect } from 'react';

export function PlatformAccessPausedHost() {
  const pathname = usePathname();

  useEffect(() => {
    registerPlatformAccessPausedHandler(() => {
      useAuthStore.getState().markPlatformAccessPaused();
      if (pathname.includes('/blocked')) return;
      router.replace('/(gate)/blocked' as Href);
    });
    return () => registerPlatformAccessPausedHandler(null);
  }, [pathname]);

  return null;
}
