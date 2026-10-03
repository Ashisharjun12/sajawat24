import type { MapMarker } from '@/module/geo/components/OlaMapView';

export function tripMarkersToPointCollection(markers: MapMarker[]) {
  const features = markers
    .filter((m) => m.variant === 'worker' || m.variant === 'customer')
    .map((m) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [m.longitude, m.latitude],
      },
      properties: { kind: m.variant },
    }));

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}
