import { isInsideIndiaBounds } from "@/module/geo/lib/india-map";

/**
 * Why the browser could not give us a position:
 * - denied: the prompt was dismissed/refused but the browser can still ask again
 * - blocked: blocked for this site; only the browser's site settings can change it
 * - unavailable / timeout / unsupported / error: no usable fix
 * - outside_india: found, but not somewhere we deliver
 */
export function currentPositionMessage(reason) {
  switch (reason) {
    case "denied":
      return "Location permission was not given. Click the locate button to allow it, or search your area.";
    case "blocked":
      return "Location is blocked for this site. Allow it in your browser's site settings, or search your area.";
    case "outside_india":
      return "Your location is outside India. Search the area you want delivery to.";
    default:
      return "Couldn't get your location. Search your area or move the pin.";
  }
}

function readPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(error),
      options,
    );
  });
}

async function permissionState() {
  try {
    if (!navigator.permissions?.query) return null;
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state; // "granted" | "denied" | "prompt"
  } catch {
    return null; // Safari / older browsers
  }
}

/**
 * The device position for the address map. Hands back a quick approximate fix (a cached position)
 * through `onApproximate` while the accurate one is read, and never waits longer than `timeoutMs`.
 * Resolves to `{ ok: true, latitude, longitude }` or `{ ok: false, reason }`.
 */
export async function getCurrentPositionForMap({ timeoutMs = 8000, onApproximate } = {}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, reason: "unsupported" };
  }

  if ((await permissionState()) === "denied") return { ok: false, reason: "blocked" };

  const denied = async () => ({
    ok: false,
    reason: (await permissionState()) === "denied" ? "blocked" : "denied",
  });

  // Quick first fix from the browser's cache so the map can move straight away.
  let approximate = null;
  try {
    approximate = await readPosition({
      enableHighAccuracy: false,
      maximumAge: 5 * 60_000,
      timeout: 2000,
    });
    if (isInsideIndiaBounds(approximate.latitude, approximate.longitude)) {
      onApproximate?.(approximate);
    }
  } catch (error) {
    if (error?.code === 1) return denied();
    // No cached fix (or too slow): wait for the real one below.
  }

  let fresh = null;
  try {
    fresh = await readPosition({ enableHighAccuracy: false, maximumAge: 0, timeout: timeoutMs });
  } catch (error) {
    if (error?.code === 1) return denied();
    if (!approximate) {
      return { ok: false, reason: error?.code === 3 ? "timeout" : "unavailable" };
    }
  }

  const coords = fresh ?? approximate;
  if (!coords) return { ok: false, reason: "error" };
  if (!isInsideIndiaBounds(coords.latitude, coords.longitude)) {
    return { ok: false, reason: "outside_india" };
  }
  return { ok: true, ...coords };
}
