export type MapLngLatBounds = [west: number, south: number, east: number, north: number];

export function boundsFromCoordinates(
  points: Array<{ latitude: number; longitude: number }>,
): MapLngLatBounds | null {
  if (points.length === 0) return null;

  let west = points[0].longitude;
  let east = points[0].longitude;
  let south = points[0].latitude;
  let north = points[0].latitude;

  for (const point of points) {
    west = Math.min(west, point.longitude);
    east = Math.max(east, point.longitude);
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
  }

  const minSpan = 0.0025; // ~250 m — keeps map tiles + both pins visible when partner is at venue
  const lngSpan = east - west;
  const latSpan = north - south;
  if (lngSpan < minSpan) {
    const c = (east + west) / 2;
    west = c - minSpan / 2;
    east = c + minSpan / 2;
  }
  if (latSpan < minSpan) {
    const c = (north + south) / 2;
    south = c - minSpan / 2;
    north = c + minSpan / 2;
  }

  return [west, south, east, north];
}
