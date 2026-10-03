import { useVendorGateStatus } from '@/module/application-review/hooks/use-vendor-gate-status';
import { Href, router } from 'expo-router';
import { useCallback } from 'react';

export function useBlockedReview() {
  const onStatusChange = useCallback((user: { vendor?: { onboardingStatus: string } } | null) => {
    const status = user?.vendor?.onboardingStatus;
    if (status === 'ACTIVE') {
      router.replace('/(app)' as Href);
    }
    if (status === 'PENDING') {
      router.replace('/(gate)/pending' as Href);
    }
    if (status === 'REJECTED') {
      router.replace('/(gate)/rejected' as Href);
    }
  }, []);

  return useVendorGateStatus({ onStatusChange });
}
