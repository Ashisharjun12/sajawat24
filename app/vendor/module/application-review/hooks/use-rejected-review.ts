import { useVendorGateStatus } from '@/module/application-review/hooks/use-vendor-gate-status';
import { Href, router } from 'expo-router';
import { useCallback } from 'react';

export function useRejectedReview() {
  const onStatusChange = useCallback((user: { vendor?: { onboardingStatus: string } } | null) => {
    if (user?.vendor?.onboardingStatus === 'ACTIVE') {
      router.replace('/(app)' as Href);
    }
    if (user?.vendor?.onboardingStatus === 'PENDING') {
      router.replace('/(gate)/pending' as Href);
    }
    if (user?.vendor?.onboardingStatus === 'BLOCKED') {
      router.replace('/(gate)/blocked' as Href);
    }
  }, []);

  return useVendorGateStatus({ onStatusChange });
}
