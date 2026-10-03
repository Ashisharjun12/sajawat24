import type { AuthUser } from '@/lib/auth.types';
import { useAuthStore } from '@/store/auth.store';
import { useCallback, useEffect, useState } from 'react';

type UseVendorGateStatusOptions = {
  onStatusChange?: (user: AuthUser | null) => void;
};

export function useVendorGateStatus({ onStatusChange }: UseVendorGateStatusOptions = {}) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const [refreshing, setRefreshing] = useState(false);

  const checkStatus = useCallback(async () => {
    const nextUser = await refreshSession();
    onStatusChange?.(nextUser);
    return nextUser;
  }, [onStatusChange, refreshSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      void checkStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await checkStatus();
    } finally {
      setRefreshing(false);
    }
  }, [checkStatus]);

  const isLoading = !hydrated || !user?.vendor;

  return {
    hydrated,
    user,
    refreshing,
    isLoading,
    handleRefresh: () => void handleRefresh(),
  };
}
