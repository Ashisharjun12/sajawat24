import {
  clearActiveEnRouteOrderId,
  loadActiveEnRouteOrderId,
  saveActiveEnRouteOrderId,
} from '@/lib/secure-storage';
import {
  installEnRouteForegroundLocationRetry,
  startEnRouteBackgroundLocation,
  stopEnRouteBackgroundLocation,
} from '@/lib/job-en-route-background-location';
import { create } from 'zustand';

type EnRouteTripState = {
  hydrated: boolean;
  activeOrderId: string | null;
  backgroundSharing: boolean;
  pendingForegroundStart: boolean;
  permissionDeniedAt: number | null;
  hydrate: () => Promise<void>;
  beginTrip: (orderId: string) => Promise<boolean>;
  endTrip: () => Promise<void>;
  ensureBackgroundSharing: () => Promise<boolean>;
  clearPermissionDenied: () => void;
};

let endTripInFlight: Promise<void> | null = null;

function applyStartResult(
  result: Awaited<ReturnType<typeof startEnRouteBackgroundLocation>>,
  get: () => EnRouteTripState,
  set: (partial: Partial<EnRouteTripState>) => void,
): boolean {
  if (result.ok) {
    set({
      backgroundSharing: true,
      pendingForegroundStart: false,
      permissionDeniedAt: null,
    });
    return true;
  }

  if (result.reason === 'needs_foreground') {
    set({
      backgroundSharing: false,
      pendingForegroundStart: true,
    });
    return false;
  }

  if (result.reason === 'denied') {
    set({
      backgroundSharing: false,
      pendingForegroundStart: false,
      permissionDeniedAt: Date.now(),
    });
    return false;
  }

  set({
    backgroundSharing: false,
    pendingForegroundStart: false,
  });
  return false;
}

export const useEnRouteTripStore = create<EnRouteTripState>((set, get) => ({
  hydrated: false,
  activeOrderId: null,
  backgroundSharing: false,
  pendingForegroundStart: false,
  permissionDeniedAt: null,

  hydrate: async () => {
    const persisted = await loadActiveEnRouteOrderId();
    set({
      hydrated: true,
      activeOrderId: persisted,
      pendingForegroundStart: Boolean(persisted),
    });
  },

  beginTrip: async (orderId) => {
    const trimmed = orderId.trim();
    if (!trimmed) return false;

    await saveActiveEnRouteOrderId(trimmed);
    set({ activeOrderId: trimmed });

    const result = await startEnRouteBackgroundLocation(trimmed);
    return applyStartResult(result, get, set);
  },

  endTrip: async () => {
    if (endTripInFlight) {
      await endTripInFlight;
      return;
    }

    endTripInFlight = (async () => {
      try {
        await stopEnRouteBackgroundLocation();
        await clearActiveEnRouteOrderId();
        set({
          activeOrderId: null,
          backgroundSharing: false,
          pendingForegroundStart: false,
          permissionDeniedAt: null,
        });
      } finally {
        endTripInFlight = null;
      }
    })();

    await endTripInFlight;
  },

  ensureBackgroundSharing: async () => {
    const orderId = get().activeOrderId;
    if (!orderId) {
      set({ backgroundSharing: false, pendingForegroundStart: false });
      return false;
    }

    const result = await startEnRouteBackgroundLocation(orderId);
    return applyStartResult(result, get, set);
  },

  clearPermissionDenied: () => set({ permissionDeniedAt: null }),
}));

installEnRouteForegroundLocationRetry(() => {
  const { activeOrderId, pendingForegroundStart, backgroundSharing } =
    useEnRouteTripStore.getState();
  if (!activeOrderId || backgroundSharing) return;
  if (!pendingForegroundStart) return;
  void useEnRouteTripStore.getState().ensureBackgroundSharing();
});
