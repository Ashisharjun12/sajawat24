import { registerSessionExpiredHandler } from '@/api/client';
import { queryClient } from '@/lib/query-client';
import { getUnauthenticatedRedirect } from '@/module/auth/lib/auth-routing';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

/** Wires silent redirect when refresh token is invalid or missing. */
export function AuthSessionBridge() {
  const router = useRouter();

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      queryClient.clear();
      const hasSeenWelcome = useAuthStore.getState().hasSeenWelcome;
      router.replace(getUnauthenticatedRedirect(hasSeenWelcome) as Href);
    });
    return () => registerSessionExpiredHandler(null);
  }, [router]);

  return null;
}
