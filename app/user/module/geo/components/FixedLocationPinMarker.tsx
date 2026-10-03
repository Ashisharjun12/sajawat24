import { MAP_FIXED_LOCATION_URL } from '@/lib/map-assets';
import { Image } from 'expo-image';

/** Fixed delivery / venue pin for trip tracking maps. */
export function FixedLocationPinMarker() {
  return (
    <Image
      source={MAP_FIXED_LOCATION_URL}
      style={{ width: 36, height: 46 }}
      contentFit="contain"
      accessibilityLabel="Delivery location"
    />
  );
}
