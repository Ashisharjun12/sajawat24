import { isInsideIndiaBounds } from '@/module/geo/lib/india-map';

export type CurrentPositionFailure =
  /** Permission refused, but the system can still ask again. */
  | 'denied'
  /** Permission refused for good: only the phone's Settings can change it. */
  | 'blocked'
  /** The phone's location switch (GPS) is off. */
  | 'services_off'
  | 'timeout'
  | 'outside_india'
  | 'error';

export type CurrentPositionResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: CurrentPositionFailure };

/** Plain-language explanation shown to the user for each failure. */
export function currentPositionMessage(reason: CurrentPositionFailure): string {
  switch (reason) {
    case 'denied':
      return 'Location permission is off. Tap the locate button to allow it, or search your area.';
    case 'blocked':
      return 'Location access is blocked for this app. Turn it on in Settings, or search your area.';
    case 'services_off':
      return "Your phone's location is switched off. Turn it on to find you, or search your area.";
    case 'outside_india':
      return 'Your location is outside India. Search the area you want delivery to.';
    case 'timeout':
    case 'error':
    default:
      return "Couldn't get your location. Search your area or move the pin.";
  }
}

type Coords = { latitude: number; longitude: number };

/**
 * The phone's current position for the address map. Asks for permission if the system still allows
 * it, hands back a quick approximate fix (last known position) through `onApproximate` while the
 * accurate one is being read, and never waits longer than `timeoutMs`.
 */
export async function getCurrentPositionForMap(
  options: {
    ask?: boolean;
    timeoutMs?: number;
    onApproximate?: (coords: Coords) => void;
  } = {},
): Promise<CurrentPositionResult> {
  const { ask = true, timeoutMs = 8000, onApproximate } = options;
  try {
    const Location = await import('expo-location');

    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      if (!ask || !permission.canAskAgain) {
        return { ok: false, reason: permission.canAskAgain ? 'denied' : 'blocked' };
      }
      permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        return { ok: false, reason: permission.canAskAgain ? 'denied' : 'blocked' };
      }
    }

    if (!(await Location.hasServicesEnabledAsync())) {
      return { ok: false, reason: 'services_off' };
    }

    // Fast first fix so the map can move straight away.
    let approximate: Coords | null = null;
    try {
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60_000,
        requiredAccuracy: 300,
      });
      if (last) {
        approximate = { latitude: last.coords.latitude, longitude: last.coords.longitude };
        if (isInsideIndiaBounds(approximate.latitude, approximate.longitude)) {
          onApproximate?.(approximate);
        }
      }
    } catch {
      // No cached fix: wait for the real one.
    }

    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);

    const coords: Coords | null = fresh
      ? { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude }
      : approximate;
    if (!coords) return { ok: false, reason: 'timeout' };
    if (!isInsideIndiaBounds(coords.latitude, coords.longitude)) {
      return { ok: false, reason: 'outside_india' };
    }
    return { ok: true, ...coords };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
