export const INDIA_BOUNDS = {
  north: 35.6745456774,
  south: 6.4626999,
  west: 68.1097,
  east: 97.395561,
};

export const INDIA_CENTER = { latitude: 20.5937, longitude: 78.9629 };

export function isInsideIndiaBounds(latitude: number, longitude: number) {
  return (
    latitude >= INDIA_BOUNDS.south &&
    latitude <= INDIA_BOUNDS.north &&
    longitude >= INDIA_BOUNDS.west &&
    longitude <= INDIA_BOUNDS.east
  );
}
