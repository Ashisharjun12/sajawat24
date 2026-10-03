import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, InteractionManager } from 'react-native';
import { EN_ROUTE_FGS_NOTIFICATION } from '@/lib/en-route-notification-copy';
import {
  logBackgroundLocationPostError,
  postJobLocationBackground,
} from '@/lib/post-job-location-background';
import { loadActiveEnRouteOrderId } from '@/lib/secure-storage';

export const EN_ROUTE_LOCATION_TASK = 'decory-en-route-location';

export type EnRouteLocationStartReason =
  | 'started'
  | 'already_running'
  | 'denied'
  | 'needs_foreground'
  | 'error';

export type EnRouteLocationStartResult = {
  ok: boolean;
  reason: EnRouteLocationStartReason;
};

let activeOrderId: string | null = null;

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

function isTaskNotFoundError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('TaskNotFound') || message.includes('not found');
}

async function safeStopLocationUpdates(): Promise<void> {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(EN_ROUTE_LOCATION_TASK);
    if (!started) return;
    await Location.stopLocationUpdatesAsync(EN_ROUTE_LOCATION_TASK);
  } catch (err) {
    if (isTaskNotFoundError(err)) return;
    console.warn('[en-route-location] stopLocationUpdatesAsync failed:', err);
  }
}

async function resolveActiveOrderId(): Promise<string | null> {
  if (activeOrderId) return activeOrderId;
  return loadActiveEnRouteOrderId();
}

if (!TaskManager.isTaskDefined(EN_ROUTE_LOCATION_TASK)) {
  TaskManager.defineTask(EN_ROUTE_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const orderId = await resolveActiveOrderId();
    if (!orderId) return;

    const locations = (data as LocationTaskData | undefined)?.locations;
    const fix = locations?.[locations.length - 1];
    if (!fix) return;
    try {
      const heading = fix.coords.heading;
      const speed = fix.coords.speed;
      await postJobLocationBackground(orderId, {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        heading: heading != null && heading >= 0 ? heading : undefined,
        speed: speed != null && speed >= 0 ? speed : undefined,
      });
    } catch (err) {
      logBackgroundLocationPostError(err);
    }
  });
}

export async function isEnRouteBackgroundLocationActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(EN_ROUTE_LOCATION_TASK);
}

/** Android 12+ rejects location FGS start while the app is not in the foreground. */
export function canStartEnRouteForegroundService(): boolean {
  return AppState.currentState === 'active';
}

export async function startEnRouteBackgroundLocation(
  orderId: string,
): Promise<EnRouteLocationStartResult> {
  const trimmed = orderId.trim();
  if (!trimmed) return { ok: false, reason: 'error' };

  const previousOrderId = activeOrderId;
  const alreadyActive = await isEnRouteBackgroundLocationActive();
  if (alreadyActive && activeOrderId === trimmed) {
    return { ok: true, reason: 'already_running' };
  }

  activeOrderId = trimmed;

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    activeOrderId = previousOrderId;
    return { ok: false, reason: 'denied' };
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== Location.PermissionStatus.GRANTED) {
    activeOrderId = previousOrderId;
    return { ok: false, reason: 'denied' };
  }

  if (!canStartEnRouteForegroundService()) {
    return { ok: false, reason: 'needs_foreground' };
  }

  try {
    if (alreadyActive) {
      await safeStopLocationUpdates();
    }

    await Location.startLocationUpdatesAsync(EN_ROUTE_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 8000,
      distanceInterval: 20,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: EN_ROUTE_FGS_NOTIFICATION.title,
        notificationBody: EN_ROUTE_FGS_NOTIFICATION.body,
      },
    });
    return { ok: true, reason: 'started' };
  } catch (err) {
    console.warn('[en-route-location] startLocationUpdatesAsync failed:', err);
    const stillRunning = await isEnRouteBackgroundLocationActive();
    if (!stillRunning) {
      activeOrderId = previousOrderId;
    }
    return { ok: false, reason: 'error' };
  }
}

export async function stopEnRouteBackgroundLocation(): Promise<void> {
  activeOrderId = null;
  await safeStopLocationUpdates();
}

type ForegroundRetryHandler = () => void | Promise<void>;

let foregroundRetryHandler: ForegroundRetryHandler | null = null;
let foregroundListenerInstalled = false;

function scheduleForegroundRetry() {
  if (AppState.currentState !== 'active') return;
  InteractionManager.runAfterInteractions(() => {
    if (AppState.currentState !== 'active') return;
    void foregroundRetryHandler?.();
  });
}

/** Register a single AppState listener to retry pending en-route FGS starts. */
export function installEnRouteForegroundLocationRetry(handler: ForegroundRetryHandler) {
  foregroundRetryHandler = handler;
  if (foregroundListenerInstalled) return;
  foregroundListenerInstalled = true;

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      scheduleForegroundRetry();
    }
  });

  scheduleForegroundRetry();
}
