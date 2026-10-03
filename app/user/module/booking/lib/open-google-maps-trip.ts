import type { PublicOrderTracking } from '@/api/orders.api';
import { Linking } from 'react-native';

function hasCoords(point: { latitude: number; longitude: number } | null | undefined) {
  return point?.latitude != null && point?.longitude != null;
}

export function buildGoogleMapsTripUrl(tracking: PublicOrderTracking): string | null {
  const vendor = tracking.vendor;
  const dest = tracking.destination;

  if (
    vendor &&
    hasCoords({ latitude: vendor.latitude!, longitude: vendor.longitude! }) &&
    hasCoords(dest)
  ) {
    const origin = `${vendor.latitude},${vendor.longitude}`;
    const destination = `${dest!.latitude},${dest!.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }

  if (hasCoords(dest)) {
    const q = `${dest!.latitude},${dest!.longitude}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  return null;
}

export function openGoogleMapsTrip(tracking: PublicOrderTracking) {
  const url = buildGoogleMapsTripUrl(tracking);
  if (!url) return;
  void Linking.openURL(url);
}
