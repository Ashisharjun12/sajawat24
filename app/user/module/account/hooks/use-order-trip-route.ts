import { getOrderRoute } from '@/api/orders.api';
import { decodeEncodedPolyline } from '@/module/geo/lib/decode-polyline';
import { ROUTE_REFETCH_MIN_MS, ROUTE_REFETCH_MOVE_M } from '@/module/geo/lib/trip-route-refetch';
import { trimRouteAhead, workerMovedMeters } from '@/module/geo/lib/trim-route-ahead';
import { useEffect, useMemo, useRef, useState } from 'react';

type LatLng = { latitude: number; longitude: number };

type Params = {
  orderId: string;
  enabled: boolean;
  vendorLat: number | null | undefined;
  vendorLng: number | null | undefined;
  destination: LatLng | null | undefined;
};

export function useOrderTripRoute({
  orderId,
  enabled,
  vendorLat,
  vendorLng,
  destination,
}: Params) {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const lastRouteFetchRef = useRef(0);
  const lastRouteOriginRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const hadVendorGpsRef = useRef(false);
  const routeCoordsRef = useRef(routeCoords);
  routeCoordsRef.current = routeCoords;

  const fetchRoute = (originLat?: number, originLng?: number) => {
    lastRouteFetchRef.current = Date.now();
    void getOrderRoute(orderId)
      .then((route) => {
        const decoded = decodeEncodedPolyline(route.encodedPolyline);
        setRouteCoords(decoded);
        if (decoded.length >= 2 && originLat != null && originLng != null) {
          lastRouteOriginRef.current = { lat: originLat, lng: originLng };
        }
      })
      .catch(() => {
        if (routeCoordsRef.current.length < 2) {
          setRouteCoords([]);
        }
      });
  };

  useEffect(() => {
    if (!enabled) {
      setRouteCoords([]);
      hadVendorGpsRef.current = false;
      return;
    }
    fetchRoute();
  }, [enabled, orderId]);

  useEffect(() => {
    if (!enabled) return;
    if (vendorLat == null || vendorLng == null) {
      hadVendorGpsRef.current = false;
      return;
    }

    const vendorJustAvailable = !hadVendorGpsRef.current;
    hadVendorGpsRef.current = true;

    if (vendorJustAvailable && routeCoordsRef.current.length < 2) {
      fetchRoute();
      return;
    }

    const now = Date.now();
    const sinceFetch = now - lastRouteFetchRef.current;
    const moved = workerMovedMeters(
      lastRouteOriginRef.current.lat,
      lastRouteOriginRef.current.lng,
      vendorLat,
      vendorLng,
    );
    const shouldRefetch =
      routeCoordsRef.current.length < 2 ||
      moved >= ROUTE_REFETCH_MOVE_M ||
      sinceFetch >= ROUTE_REFETCH_MIN_MS;
    if (!shouldRefetch) return;
    fetchRoute(vendorLat, vendorLng);
  }, [enabled, orderId, vendorLat, vendorLng]);

  const displayRouteCoords = useMemo(() => {
    if (routeCoords.length < 2) return routeCoords;
    if (vendorLat == null || vendorLng == null) return routeCoords;
    return trimRouteAhead(routeCoords, vendorLat, vendorLng);
  }, [routeCoords, vendorLat, vendorLng]);

  const fallbackLine = useMemo((): LatLng[] => {
    if (displayRouteCoords.length >= 2 || routeCoords.length >= 2) return [];
    if (
      vendorLat == null ||
      vendorLng == null ||
      destination?.latitude == null ||
      destination?.longitude == null
    ) {
      return [];
    }
    return [
      { latitude: vendorLat, longitude: vendorLng },
      { latitude: destination.latitude, longitude: destination.longitude },
    ];
  }, [
    displayRouteCoords.length,
    routeCoords.length,
    vendorLat,
    vendorLng,
    destination?.latitude,
    destination?.longitude,
  ]);

  return { routeCoords, displayRouteCoords, fallbackLine };
}
