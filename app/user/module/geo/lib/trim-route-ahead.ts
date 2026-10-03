import { haversineDistanceMeters } from '@/module/geo/lib/haversine';

/** Remaining road polyline ahead of the worker. */
export function trimRouteAhead(
  points: Array<{ latitude: number; longitude: number }>,
  workerLat: number | null | undefined,
  workerLng: number | null | undefined,
): Array<{ latitude: number; longitude: number }> {
  if (!points.length || workerLat == null || workerLng == null) return points;
  if (points.length < 2) return points;

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const d = haversineDistanceMeters(workerLat, workerLng, p.latitude, p.longitude);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  const trimmed = points.slice(bestIdx);
  if (trimmed.length >= 2) return trimmed;

  const last = points[points.length - 1];
  return [
    { latitude: workerLat, longitude: workerLng },
    { latitude: last.latitude, longitude: last.longitude },
  ];
}

export function workerMovedMeters(
  originLat: number | null,
  originLng: number | null,
  lat: number | null | undefined,
  lng: number | null | undefined,
): number {
  if (originLat == null || originLng == null || lat == null || lng == null) return 0;
  return haversineDistanceMeters(originLat, originLng, lat, lng);
}
