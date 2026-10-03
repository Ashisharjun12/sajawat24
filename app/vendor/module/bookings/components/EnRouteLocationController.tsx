import { getVendorJob } from '@/api/jobs.api';
import { findActiveEnRouteJobId } from '@/lib/resume-en-route-trip';
import { useAuthStore } from '@/store/auth.store';
import { useEnRouteTripStore } from '@/store/en-route-trip.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { useEffect, useRef } from 'react';
import { Alert, AppState, InteractionManager, type AppStateStatus } from 'react-native';

const VERIFY_INTERVAL_MS = 60_000;

function scheduleVerifyWhenForeground(verify: () => void | Promise<void>) {
  if (AppState.currentState !== 'active') return;
  InteractionManager.runAfterInteractions(() => {
    if (AppState.currentState === 'active') {
      void verify();
    }
  });
}

export function EnRouteLocationController() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);

  const hydrated = useEnRouteTripStore((s) => s.hydrated);
  const activeOrderId = useEnRouteTripStore((s) => s.activeOrderId);
  const hydrate = useEnRouteTripStore((s) => s.hydrate);
  const beginTrip = useEnRouteTripStore((s) => s.beginTrip);
  const endTrip = useEnRouteTripStore((s) => s.endTrip);
  const ensureBackgroundSharing = useEnRouteTripStore((s) => s.ensureBackgroundSharing);

  const verifyingRef = useRef(false);
  const resumePromptedRef = useRef(false);

  useEffect(() => {
    if (!isFieldShell) {
      if (activeOrderId) {
        void endTrip();
      }
      return;
    }
    void hydrate();
  }, [isFieldShell, hydrate, activeOrderId, endTrip]);

  useEffect(() => {
    if (!isFieldShell || !hydrated || !accessToken) return;
    if (activeOrderId || resumePromptedRef.current) return;

    void (async () => {
      try {
        const orderId = await findActiveEnRouteJobId();
        if (!orderId) return;
        resumePromptedRef.current = true;
        Alert.alert(
          'Resume live sharing?',
          'You have a delivery in progress. Turn location sharing back on so the customer can track you.',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Resume',
              onPress: () => {
                void beginTrip(orderId);
              },
            },
          ],
        );
      } catch {
        // list may fail offline; retry on next foreground verify
      }
    })();
  }, [isFieldShell, hydrated, accessToken, activeOrderId, beginTrip]);

  useEffect(() => {
    if (!isFieldShell || !hydrated) return undefined;

    async function verifyTrip() {
      if (verifyingRef.current) return;
      const orderId = useEnRouteTripStore.getState().activeOrderId;
      if (!orderId) return;

      verifyingRef.current = true;
      try {
        const job = await getVendorJob(orderId);
        if (job.status === 'EN_ROUTE') {
          if (AppState.currentState === 'active') {
            await ensureBackgroundSharing();
          }
        } else {
          await endTrip();
        }
      } catch {
        // keep session; retry on next interval / foreground
      } finally {
        verifyingRef.current = false;
      }
    }

    scheduleVerifyWhenForeground(verifyTrip);

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void verifyTrip();
      }
    }, VERIFY_INTERVAL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        scheduleVerifyWhenForeground(verifyTrip);
      }
    };
    const subscription = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isFieldShell, hydrated, activeOrderId, endTrip, ensureBackgroundSharing]);

  return null;
}
