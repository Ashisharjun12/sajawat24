import { TRIP_MARKER_PX, tripMarkerDataUrl } from '@/module/geo/lib/trip-map-markers';
import { Image } from 'expo-image';

type Props = { size?: number; className?: string };

export function TripWorkerMarkerIcon({ size = TRIP_MARKER_PX, className }: Props) {
  return (
    <Image
      source={{ uri: tripMarkerDataUrl('worker') }}
      style={{ width: size, height: size }}
      className={className}
      contentFit="contain"
      accessibilityLabel="Partner on the way"
    />
  );
}

export function TripCustomerMarkerIcon({ size = TRIP_MARKER_PX, className }: Props) {
  return (
    <Image
      source={{ uri: tripMarkerDataUrl('customer') }}
      style={{ width: size, height: size }}
      className={className}
      contentFit="contain"
      accessibilityLabel="Customer venue"
    />
  );
}
