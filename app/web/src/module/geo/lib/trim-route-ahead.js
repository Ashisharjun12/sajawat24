const EARTH_RADIUS_M = 6_371_000;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readLatLng(point) {
  if (!point) return null;
  const lat = point.lat ?? point.latitude;
  const lng = point.lng ?? point.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

/**
 * Keep only the polyline ahead of the worker (remaining route on roads).
 * @param {Array<{ lat?: number, lng?: number, latitude?: number, longitude?: number }>} points
 */
export function trimRouteAhead(points, workerLat, workerLng) {
  if (!points?.length || workerLat == null || workerLng == null) {
    return points ?? [];
  }
  if (points.length < 2) return points;

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const p = readLatLng(points[i]);
    if (!p) continue;
    const d = haversineMeters(p.lat, p.lng, workerLat, workerLng);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  const trimmed = points.slice(bestIdx).map((p) => {
    const ll = readLatLng(p);
    return ll ? { lat: ll.lat, lng: ll.lng } : p;
  });

  if (trimmed.length >= 2) return trimmed;

  const last = readLatLng(points[points.length - 1]);
  if (last) {
    return [
      { lat: workerLat, lng: workerLng },
      { lat: last.lat, lng: last.lng },
    ];
  }
  return points;
}

export function workerMovedMeters(originLat, originLng, lat, lng) {
  if (originLat == null || originLng == null || lat == null || lng == null) return 0;
  return haversineMeters(originLat, originLng, lat, lng);
}
