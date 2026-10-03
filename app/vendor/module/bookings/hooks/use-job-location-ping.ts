import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { postVendorJobLocation } from '@/api/jobs.api';

const INTERVAL_MS = 8000;

export function useJobLocationPing(orderId: string | undefined, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastFix, setLastFix] = useState<{ latitude: number; longitude: number } | null>(null);
  const [suggestOnSite, setSuggestOnSite] = useState(false);

  useEffect(() => {
    if (!orderId || !enabled) {
      setSuggestOnSite(false);
      return undefined;
    }

    let cancelled = false;

    async function tick() {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;
        const fix = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const latitude = fix.coords.latitude;
        const longitude = fix.coords.longitude;
        setLastFix({ latitude, longitude });
        const heading = fix.coords.heading;
        const speed = fix.coords.speed;
        const result = await postVendorJobLocation(orderId!, {
          latitude,
          longitude,
          heading: heading != null && heading >= 0 ? heading : undefined,
          speed: speed != null && speed >= 0 ? speed : undefined,
        });
        if (!cancelled) {
          setSuggestOnSite(Boolean(result.suggestOnSite));
        }
      } catch {
        // ignore transient GPS / network errors
      }
    }

    void tick();
    timerRef.current = setInterval(() => void tick(), INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orderId, enabled]);

  return { lastFix, suggestOnSite };
}
