import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { AppSpinner } from '@/components/ui/app-spinner';
import { getInstantConfig } from '@/api/config.api';
import { getVendorJobRoute } from '@/api/jobs.api';
import { decodeEncodedPolyline } from '@/module/onboarding/lib/decode-polyline';
import { useMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import { OlaMapView } from '@/module/geo/components/OlaMapView';
import { formatRouteSummary } from '@/module/bookings/lib/format-route-summary';
import { haversineDistanceMeters } from '@/module/geo/lib/haversine';
import { ROUTE_REFETCH_MIN_MS, ROUTE_REFETCH_MOVE_M } from '@/module/geo/lib/trip-route-refetch';
import { trimRouteAhead, workerMovedMeters } from '@/module/geo/lib/trim-route-ahead';

export type RouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
  isEstimate: boolean;
};

type Props = {
  orderId?: string;
  destination?: { latitude: number; longitude: number } | null;
  vendor?: { latitude: number; longitude: number } | null;
  showRoute?: boolean;
  layout?: 'compact' | 'trip';
  followVendor?: boolean;
  refetchRouteOnMove?: boolean;
  showMap?: boolean;
  onOpenExternalMaps?: () => void;
  onRouteLoaded?: (summary: RouteSummary | null) => void;
};

export function JobTrackingMap({
  orderId,
  destination,
  vendor,
  showRoute = true,
  layout = 'compact',
  followVendor = false,
  refetchRouteOnMove = false,
  showMap = true,
  onOpenExternalMaps,
  onRouteLoaded,
}: Props) {
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const [routeCoords, setRouteCoords] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const lastRouteFetchRef = useRef(0);
  const lastRouteOriginRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const hadVendorGpsRef = useRef(false);
  const { config: sdkConfig, loading: sdkLoading, error: sdkError, retry } = useMapsSdkConfig();

  const center = destination ?? vendor;

  const markers = useMemo(() => {
    const list = [];
    if (destination?.latitude != null && destination?.longitude != null) {
      list.push({
        id: 'destination',
        latitude: destination.latitude,
        longitude: destination.longitude,
        color: '#1A1A1A',
        variant: 'customer' as const,
      });
    }
    if (vendor?.latitude != null && vendor?.longitude != null) {
      list.push({
        id: 'vendor',
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        color: '#F5C518',
        variant: 'worker' as const,
      });
    }
    return list;
  }, [destination, vendor]);

  const displayRouteCoords = useMemo(() => {
    if (routeCoords.length < 2) return routeCoords;
    if (vendor?.latitude == null || vendor?.longitude == null) return routeCoords;
    return trimRouteAhead(routeCoords, vendor.latitude, vendor.longitude);
  }, [routeCoords, vendor?.latitude, vendor?.longitude]);

  /** Booking delivery pin is fixed; partner GPS moves — draw a direct line until road route loads. */
  const fallbackLine = useMemo(() => {
    if (displayRouteCoords.length >= 2 || routeCoords.length >= 2) return [];
    if (
      vendor?.latitude == null ||
      vendor?.longitude == null ||
      destination?.latitude == null ||
      destination?.longitude == null
    ) {
      return [];
    }
    return [
      { latitude: vendor.latitude, longitude: vendor.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
    ];
  }, [
    displayRouteCoords.length,
    routeCoords.length,
    vendor?.latitude,
    vendor?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  const fitCoordinates = useMemo(() => {
    if (displayRouteCoords.length >= 2) return displayRouteCoords;
    const pts: Array<{ latitude: number; longitude: number }> = [];
    if (vendor?.latitude != null && vendor?.longitude != null) {
      pts.push({ latitude: vendor.latitude, longitude: vendor.longitude });
    }
    if (destination?.latitude != null && destination?.longitude != null) {
      pts.push({ latitude: destination.latitude, longitude: destination.longitude });
    }
    return pts;
  }, [displayRouteCoords, routeCoords, vendor, destination]);

  useEffect(() => {
    void getInstantConfig()
      .then((cfg) => setMapsEnabled(Boolean(cfg.maps?.vendorApp)))
      .catch(() => setMapsEnabled(false));
  }, []);

  useEffect(() => {
    if (layout === 'trip') {
      retry();
    }
  }, [layout, retry]);

  useEffect(() => {
    onRouteLoaded?.(routeSummary);
  }, [routeSummary, onRouteLoaded]);

  const applyRouteFallback = () => {
    setRouteCoords([]);
    if (
      vendor?.latitude != null &&
      vendor?.longitude != null &&
      destination?.latitude != null &&
      destination?.longitude != null
    ) {
      const distanceMeters = haversineDistanceMeters(
        vendor.latitude,
        vendor.longitude,
        destination.latitude,
        destination.longitude,
      );
      const durationSeconds = Math.round((distanceMeters / 8.33) * 1.2);
      setRouteSummary({
        distanceMeters,
        durationSeconds,
        isEstimate: true,
      });
    } else {
      setRouteSummary(null);
    }
  };

  const fetchRoute = (orderIdToFetch: string, originLat?: number, originLng?: number) => {
    lastRouteFetchRef.current = Date.now();
    void getVendorJobRoute(orderIdToFetch)
      .then((route) => {
        const decoded = decodeEncodedPolyline(route.encodedPolyline);
        setRouteCoords(decoded);
        if (decoded.length >= 2) {
          setRouteSummary({
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
            isEstimate: false,
          });
          if (originLat != null && originLng != null) {
            lastRouteOriginRef.current = { lat: originLat, lng: originLng };
          }
        } else {
          applyRouteFallback();
        }
      })
      .catch(() => {
        if (routeCoords.length < 2) {
          applyRouteFallback();
        }
      });
  };

  useEffect(() => {
    if (!mapsEnabled || !showRoute || !orderId) return;
    fetchRoute(orderId);
  }, [mapsEnabled, orderId, showRoute]);

  useEffect(() => {
    if (!mapsEnabled || !showRoute || !orderId) return;
    if (vendor?.latitude == null || vendor?.longitude == null) {
      hadVendorGpsRef.current = false;
      return;
    }

    const hasVendorGps = true;
    const vendorJustAvailable = hasVendorGps && !hadVendorGpsRef.current;
    hadVendorGpsRef.current = hasVendorGps;

    if (vendorJustAvailable && routeCoords.length < 2) {
      fetchRoute(orderId);
      return;
    }

    if (!refetchRouteOnMove) return;
    const now = Date.now();
    const sinceFetch = now - lastRouteFetchRef.current;
    const moved = workerMovedMeters(
      lastRouteOriginRef.current.lat,
      lastRouteOriginRef.current.lng,
      vendor.latitude,
      vendor.longitude,
    );
    const shouldRefetch =
      routeCoords.length < 2 ||
      moved >= ROUTE_REFETCH_MOVE_M ||
      sinceFetch >= ROUTE_REFETCH_MIN_MS;
    if (!shouldRefetch) return;
    fetchRoute(orderId, vendor.latitude, vendor.longitude);
  }, [
    refetchRouteOnMove,
    mapsEnabled,
    showRoute,
    orderId,
    vendor?.latitude,
    vendor?.longitude,
    routeCoords.length,
  ]);

  const isTrip = layout === 'trip';

  function MapFallback({ message }: { message: string }) {
    return (
      <View
        className={
          isTrip
            ? 'flex-1 items-center justify-center gap-3 rounded-2xl bg-muted px-4 py-6'
            : 'rounded-2xl bg-muted px-4 py-3'
        }>
        <Text className="text-center text-sm text-muted-foreground">{message}</Text>
        <Text className="text-center text-xs text-muted-foreground">
          Check mobile data, API URL, and server Ola Maps keys.
        </Text>
        <View className="mt-1 flex-row flex-wrap justify-center gap-2">
          <Button className="rounded-full" variant="outline" size="sm" onPress={retry}>
            <Text>Try again</Text>
          </Button>
          {onOpenExternalMaps ? (
            <Button className="rounded-full" size="sm" onPress={onOpenExternalMaps}>
              <Text>Open in Maps</Text>
            </Button>
          ) : null}
        </View>
      </View>
    );
  }

  if (!mapsEnabled) {
    return (
      <View className={isTrip ? 'flex-1' : undefined}>
        <View className="rounded-2xl bg-muted px-4 py-3">
          <Text className="text-sm text-muted-foreground">Map view is off for this account.</Text>
        </View>
      </View>
    );
  }

  if (!showMap) {
    return (
      <View
        className={
          isTrip
            ? 'flex-1 items-center justify-center rounded-2xl bg-muted'
            : 'h-48 items-center justify-center rounded-2xl bg-muted'
        }>
        <AppSpinner size="sm" />
      </View>
    );
  }

  if (sdkLoading) {
    return (
      <View
        className={
          isTrip
            ? 'flex-1 items-center justify-center rounded-2xl bg-muted'
            : 'h-48 items-center justify-center rounded-2xl bg-muted'
        }>
        <AppSpinner size="sm" />
      </View>
    );
  }

  if (sdkError || !sdkConfig) {
    return (
      <View className={isTrip ? 'flex-1' : undefined}>
        <MapFallback message="Map is unavailable. Check connection and server maps config." />
      </View>
    );
  }

  if (!center?.latitude || !center?.longitude) {
    return null;
  }

  const followCenter =
    isTrip && followVendor && vendor?.latitude != null && vendor?.longitude != null
      ? { latitude: vendor.latitude, longitude: vendor.longitude }
      : null;

  const summaryLabel =
    routeSummary != null
      ? formatRouteSummary(routeSummary.distanceMeters, routeSummary.durationSeconds) +
        (routeSummary.isEstimate ? ' (est.)' : '')
      : null;

  return (
    <View className={isTrip ? 'min-h-0 flex-1 overflow-hidden' : 'h-48 overflow-hidden rounded-2xl'}>
      <View className="relative flex-1">
        <OlaMapView
          sdkConfig={sdkConfig}
          center={{ latitude: center.latitude, longitude: center.longitude }}
          zoom={isTrip ? 15 : 14}
          markers={markers}
          routeCoordinates={displayRouteCoords}
          fallbackLine={fallbackLine}
          variant={isTrip ? 'trip' : 'static'}
          followCenter={followCenter}
          fitCoordinates={fitCoordinates}
          className="flex-1"
        />
        {isTrip && summaryLabel ? (
          <View
            className="absolute left-3 top-14 rounded-full border border-border/80 bg-background/95 px-3 py-1.5 shadow-sm"
            pointerEvents="none">
            <Text className="text-foreground text-xs font-semibold">{summaryLabel}</Text>
          </View>
        ) : null}
      </View>
      {!isTrip && summaryLabel ? (
        <Text className="mt-1 text-center text-xs text-muted-foreground">{summaryLabel}</Text>
      ) : null}
      {!isTrip ? (
        <Text className="mt-2 text-center text-xs text-muted-foreground">
          Keep the app open while en route so the customer can track you live.
        </Text>
      ) : null}
    </View>
  );
}
