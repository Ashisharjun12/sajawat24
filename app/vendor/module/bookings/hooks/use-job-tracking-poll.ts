import { useEffect, useState } from 'react';
import { getVendorJobTracking, type VendorJobTracking } from '@/api/jobs.api';

const TRACKING_POLL_MS = 8000;

export function useJobTrackingPoll(
  orderId: string | undefined,
  enabled: boolean,
): VendorJobTracking | null {
  const [tracking, setTracking] = useState<VendorJobTracking | null>(null);

  useEffect(() => {
    if (!orderId || !enabled) {
      setTracking(null);
      return undefined;
    }

    let cancelled = false;

    async function tick() {
      try {
        const data = await getVendorJobTracking(orderId!);
        if (!cancelled) setTracking(data);
      } catch {
        // ignore transient errors; keep last snapshot
      }
    }

    void tick();
    const timer = setInterval(() => void tick(), TRACKING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId, enabled]);

  return tracking;
}
