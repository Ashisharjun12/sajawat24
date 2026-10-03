import type { MapsSdkConfig } from '@/api/maps.api';
import { FixedLocationPinMarker } from '@/module/geo/components/FixedLocationPinMarker';
import { LiveLocationDotView } from '@/module/geo/components/LiveLocationDotView';
import { boundsFromCoordinates } from '@/module/geo/lib/map-bounds';
import { applyOlaMapAuth } from '@/module/geo/lib/ola-map-auth';
import { TRIP_ROUTE_PAINT } from '@/module/geo/lib/trip-map-markers';
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
} from '@maplibre/maplibre-react-native';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

export type TrackingMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  variant: 'worker' | 'customer';
};

const ROUTE_SOURCE_ID = 'decory-user-route';
const ROUTE_CASING_LAYER_ID = 'decory-user-route-casing';
const ROUTE_LAYER_ID = 'decory-user-route-line';
const FALLBACK_SOURCE_ID = 'decory-user-route-fallback';
const FALLBACK_CASING_LAYER_ID = 'decory-user-route-fallback-casing';
const FALLBACK_LAYER_ID = 'decory-user-route-fallback-line';

type Props = {
  sdkConfig: MapsSdkConfig;
  markers: TrackingMapMarker[];
  centerFallback: { latitude: number; longitude: number };
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  fallbackLine?: Array<{ latitude: number; longitude: number }>;
  className?: string;
};

export function OlaTrackingMapView({
  sdkConfig,
  markers,
  centerFallback,
  routeCoordinates = [],
  fallbackLine = [],
  className,
}: Props) {
  const cameraRef = useRef<CameraRef>(null);

  useLayoutEffect(() => {
    applyOlaMapAuth(sdkConfig);
  }, [sdkConfig]);

  const mapRemountKey = `${sdkConfig.authMode}:${sdkConfig.styleUrl}`;

  const fitPoints = useMemo(() => {
    if (routeCoordinates.length >= 2) return routeCoordinates;
    if (fallbackLine.length >= 2) return fallbackLine;
    return markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude }));
  }, [markers, routeCoordinates, fallbackLine]);

  useEffect(() => {
    const bounds = boundsFromCoordinates(fitPoints);
    if (bounds) {
      cameraRef.current?.fitBounds(bounds, {
        padding: { top: 56, right: 32, bottom: 72, left: 32 },
        duration: 400,
      });
      return;
    }
    cameraRef.current?.easeTo({
      center: [centerFallback.longitude, centerFallback.latitude],
      zoom: 14,
      duration: 400,
    });
  }, [fitPoints, centerFallback.latitude, centerFallback.longitude]);

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

  return (
    <View className={className ?? 'flex-1'}>
      <Map
        key={mapRemountKey}
        style={{ flex: 1 }}
        mapStyle={sdkConfig.styleUrl}
        dragPan
        touchZoom
        doubleTapZoom
        touchRotate={false}
        touchPitch={false}
        attribution={false}
        logo={false}>
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [centerFallback.longitude, centerFallback.latitude],
            zoom: 14,
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
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            id={marker.id}
            lngLat={[marker.longitude, marker.latitude]}
            anchor={marker.variant === 'customer' ? 'bottom' : 'center'}>
            {marker.variant === 'worker' ? (
              <LiveLocationDotView />
            ) : (
              <FixedLocationPinMarker />
            )}
          </Marker>
        ))}
      </Map>
    </View>
  );
}
