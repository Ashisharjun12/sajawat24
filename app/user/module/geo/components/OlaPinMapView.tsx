import type { MapsSdkConfig } from '@/api/maps.api';
import { applyOlaMapAuth } from '@/module/geo/lib/ola-map-auth';
import {
  Camera,
  type CameraRef,
  Map,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { View } from 'react-native';

export type MapCenterChange = {
  latitude: number;
  longitude: number;
  zoom?: number;
  userInteraction?: boolean;
};

type Props = {
  sdkConfig: MapsSdkConfig;
  center: { latitude: number; longitude: number };
  zoom?: number;
  /** Increment to move the camera programmatically (search, GPS, etc.). */
  flyToKey?: number;
  onCenterChange?: (change: MapCenterChange) => void;
  className?: string;
  showUserLocation?: boolean;
  minZoom?: number;
  maxZoom?: number;
};

export function OlaPinMapView({
  sdkConfig,
  center,
  zoom = 16,
  flyToKey = 0,
  onCenterChange,
  className,
  showUserLocation = false,
  minZoom = 4,
  maxZoom = 20,
}: Props) {
  const cameraRef = useRef<CameraRef>(null);
  const flyTargetRef = useRef({ center, zoom });

  flyTargetRef.current = { center, zoom };

  useLayoutEffect(() => {
    applyOlaMapAuth(sdkConfig);
  }, [sdkConfig.accessToken, sdkConfig.apiKey, sdkConfig.authMode, sdkConfig.styleUrl]);

  const mapRemountKey = `${sdkConfig.authMode}:${sdkConfig.styleUrl}`;

  useEffect(() => {
    const { center: target, zoom: targetZoom } = flyTargetRef.current;
    cameraRef.current?.easeTo({
      center: [target.longitude, target.latitude],
      zoom: targetZoom,
      duration: 450,
    });
  }, [flyToKey]);

  return (
    <View className={className ?? 'flex-1'}>
      <Map
        key={mapRemountKey}
        style={{ flex: 1 }}
        mapStyle={sdkConfig.styleUrl}
        dragPan
        touchZoom
        doubleTapZoom
        doubleTapHoldZoom
        touchRotate={false}
        touchPitch={false}
        attribution={false}
        logo={false}
        onRegionDidChange={(event) => {
          if (!onCenterChange) return;
          const payload = event.nativeEvent;
          const centerCoord = payload.center;
          if (!Array.isArray(centerCoord) || centerCoord.length < 2) return;
          const [longitude, latitude] = centerCoord;
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
          onCenterChange({
            latitude,
            longitude,
            zoom: payload.zoom,
            userInteraction: payload.userInteraction,
          });
        }}>
        <Camera
          ref={cameraRef}
          minZoom={minZoom}
          maxZoom={maxZoom}
          initialViewState={{
            center: [center.longitude, center.latitude],
            zoom,
          }}
        />
        {showUserLocation ? (
          <UserLocation animated accuracy heading={false} minDisplacement={1} />
        ) : null}
      </Map>
    </View>
  );
}
