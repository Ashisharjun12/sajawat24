import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { useCallback, useState } from 'react';

export function useProfileSignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  const [loggingOut, setLoggingOut] = useState(false);

  const performSignOut = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      router.replace('/(onboarding)/login' as Href);
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, signOut]);

  return { loggingOut, performSignOut };
}
