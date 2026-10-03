import type { MapsSdkConfig } from '@/api/maps.api';
import { MAP_PIN_IMAGE_URL } from '@/module/geo/components/MapCenterPin';
import { boundsFromCoordinates } from '@/module/geo/lib/map-bounds';
import { applyOlaMapAuth } from '@/module/geo/lib/ola-map-auth';
import { FixedLocationPinMarker } from '@/module/geo/components/FixedLocationPinMarker';
import { LiveLocationDotView } from '@/module/geo/components/LiveLocationDotView';
import { TRIP_ROUTE_PAINT } from '@/module/geo/lib/trip-map-markers';
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
} from '@maplibre/maplibre-react-native';
import { Image } from 'expo-image';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  variant?: 'dot' | 'pin' | 'worker' | 'customer';
};

type Props = {
  sdkConfig: MapsSdkConfig;
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: MapMarker[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  onCenterChange?: (center: { latitude: number; longitude: number }) => void;
  className?: string;
  variant?: 'static' | 'trip';
  followCenter?: { latitude: number; longitude: number } | null;
  fitCoordinates?: Array<{ latitude: number; longitude: number }>;
  fallbackLine?: Array<{ latitude: number; longitude: number }>;
};

const ROUTE_SOURCE_ID = 'decory-route';
const ROUTE_CASING_LAYER_ID = 'decory-route-casing';
const ROUTE_LAYER_ID = 'decory-route-line';
const FALLBACK_SOURCE_ID = 'decory-route-fallback';
const FALLBACK_CASING_LAYER_ID = 'decory-route-fallback-casing';
const FALLBACK_LAYER_ID = 'decory-route-fallback-line';
function TripMarkerContent({ marker }: { marker: MapMarker }) {
  if (marker.variant === 'worker') {
    return <LiveLocationDotView />;
  }
  if (marker.variant === 'customer') {
    return <FixedLocationPinMarker />;
  }
  if (marker.variant === 'pin') {
    return (
      <Image
        source={{ uri: MAP_PIN_IMAGE_URL }}
        style={{ width: 32, height: 42 }}
        contentFit="contain"
      />
    );
  }
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: marker.color,
        borderWidth: 2,
        borderColor: '#fff',
      }}
    />
  );
}

export function OlaMapView({
  sdkConfig,
  center,
  zoom = 14,
  markers = [],
  routeCoordinates = [],
  onCenterChange,
  className,
  variant = 'static',
  followCenter,
  fitCoordinates = [],
  fallbackLine = [],
}: Props) {
  const cameraRef = useRef<CameraRef>(null);

  useLayoutEffect(() => {
    applyOlaMapAuth(sdkConfig);
  }, [sdkConfig.accessToken, sdkConfig.apiKey, sdkConfig.authMode, sdkConfig.styleUrl]);

  const mapRemountKey = `${sdkConfig.authMode}:${sdkConfig.styleUrl}:${sdkConfig.accessToken?.slice(0, 12) ?? ''}:${sdkConfig.apiKey?.slice(0, 8) ?? ''}`;

  useEffect(() => {
    if (variant === 'trip') {
      const points =
        fitCoordinates.length >= 2
          ? fitCoordinates
          : routeCoordinates.length >= 2
            ? routeCoordinates
            : fallbackLine.length >= 2
              ? fallbackLine
              : markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude }));

      const bounds = boundsFromCoordinates(points);
      if (bounds) {
        cameraRef.current?.fitBounds(bounds, {
          padding: { top: 72, right: 40, bottom: 110, left: 40 },
          duration: 500,
        });
        return;
      }
      if (followCenter) {
        cameraRef.current?.easeTo({
          center: [followCenter.longitude, followCenter.latitude],
          zoom: 15,
          duration: 600,
        });
        return;
      }
    }

    cameraRef.current?.jumpTo({
      center: [center.longitude, center.latitude],
      zoom,
    });
  }, [
    center.latitude,
    center.longitude,
    zoom,
    variant,
    followCenter?.latitude,
    followCenter?.longitude,
    fitCoordinates,
    routeCoordinates,
    fallbackLine,
    markers,
  ]);

  const routeGeoJson = useMemo(() => {
    if (routeCoordinates.length < 2) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: routeCoordinates.map((p) => [p.longitude, p.latitude]),
      },
      properties: {},
    };
  }, [routeCoordinates]);

  const fallbackGeoJson = useMemo(() => {
    if (routeGeoJson || fallbackLine.length < 2) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: fallbackLine.map((p) => [p.longitude, p.latitude]),
      },
      properties: {},
    };
  }, [routeGeoJson, fallbackLine]);

  const tripMarkers = useMemo(
    () =>
      markers.map((marker) => ({
        ...marker,
        variant:
          marker.variant ??
          (variant === 'trip' && marker.id === 'destination'
            ? 'customer'
            : variant === 'trip' && marker.id === 'vendor'
              ? 'worker'
              : 'dot'),
      })),
    [markers, variant],
  );

  return (
    <View className={className ?? 'flex-1'}>
      <Map
        key={mapRemountKey}
        style={{ flex: 1 }}
        mapStyle={sdkConfig.styleUrl}
        onRegionDidChange={(event) => {
          if (!onCenterChange) return;
          const centerCoord = event.nativeEvent.center;
          if (!Array.isArray(centerCoord) || centerCoord.length < 2) return;
          const [longitude, latitude] = centerCoord;
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            onCenterChange({ latitude, longitude });
          }
        }}>
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [center.longitude, center.latitude],
            zoom,
          }}
        />
        {routeGeoJson ? (
          <GeoJSONSource id={ROUTE_SOURCE_ID} data={routeGeoJson}>
            <Layer
              id={ROUTE_CASING_LAYER_ID}
              type="line"
              paint={TRIP_ROUTE_PAINT.casing}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id={ROUTE_LAYER_ID}
              type="line"
              paint={TRIP_ROUTE_PAINT.line}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : null}
        {fallbackGeoJson ? (
          <GeoJSONSource id={FALLBACK_SOURCE_ID} data={fallbackGeoJson}>
            <Layer
              id={FALLBACK_CASING_LAYER_ID}
              type="line"
              paint={{ ...TRIP_ROUTE_PAINT.casing, 'line-opacity': 0.5, 'line-width': 7 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id={FALLBACK_LAYER_ID}
              type="line"
              paint={TRIP_ROUTE_PAINT.fallback}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : null}
        {tripMarkers.map((marker) => (
          <Marker
            key={marker.id}
            id={marker.id}
            lngLat={[marker.longitude, marker.latitude]}
            anchor={
              marker.variant === 'pin' || marker.variant === 'customer'
                ? 'bottom'
                : 'center'
            }>
            <TripMarkerContent marker={marker} />
          </Marker>
        ))}
      </Map>
    </View>
  );
}
