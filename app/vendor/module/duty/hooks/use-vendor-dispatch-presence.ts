import { getInstantConfig } from '@/api/config.api';
import { postVendorPresence, postVendorPresenceHeartbeat } from '@/api/jobs.api';
import { haversineDistanceMeters } from '@/module/geo/lib/haversine';
import { useAuthStore } from '@/store/auth.store';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const DEFAULT_PRESENCE = {
  heartbeatSec: 30,
  locationMinIntervalSec: 5,
  locationMinMoveM: 20,
};

export function useVendorDispatchPresence() {
  const vendor = useAuthStore((s) => s.user?.vendor);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isOnDuty = vendor?.isOnDuty ?? false;
  const isActiveVendor = vendor?.onboardingStatus === 'ACTIVE';

  const { data: instantConfig } = useQuery({
    queryKey: ['instant-config'],
    queryFn: getInstantConfig,
    enabled: Boolean(accessToken && isActiveVendor && isOnDuty),
    staleTime: 5 * 60_000,
  });

  const dispatchEnabled = instantConfig?.dispatchEnabled === true;
  const presence = instantConfig?.presence ?? DEFAULT_PRESENCE;

  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastPresenceAtRef = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const tickingRef = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const shouldRun = Boolean(accessToken && isActiveVendor && isOnDuty && dispatchEnabled);
    if (!shouldRun) {
      lastFixRef.current = null;
      lastPresenceAtRef.current = 0;
      return undefined;
    }

    const heartbeatMs = presence.heartbeatSec * 1000;

    async function tick() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      try {
        if (appStateRef.current !== 'active') {
          await postVendorPresenceHeartbeat();
          return;
        }

        const fix = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = fix.coords.latitude;
        const lng = fix.coords.longitude;
        const now = Date.now();
        const last = lastFixRef.current;
        const movedM =
          last === null
            ? presence.locationMinMoveM
            : haversineDistanceMeters(last.lat, last.lng, lat, lng);
        const intervalElapsed =
          now - lastPresenceAtRef.current >= presence.locationMinIntervalSec * 1000;

        if (last === null || movedM >= presence.locationMinMoveM || intervalElapsed) {
          await postVendorPresence({ latitude: lat, longitude: lng, onDuty: true });
          lastFixRef.current = { lat, lng };
          lastPresenceAtRef.current = now;
        } else {
          await postVendorPresenceHeartbeat();
        }
      } catch {
        // retry on next interval
      } finally {
        tickingRef.current = false;
      }
    }

    void tick();
    const interval = setInterval(() => void tick(), heartbeatMs);
    return () => clearInterval(interval);
  }, [
    accessToken,
    isActiveVendor,
    isOnDuty,
    dispatchEnabled,
    presence.heartbeatSec,
    presence.locationMinIntervalSec,
    presence.locationMinMoveM,
  ]);
}
