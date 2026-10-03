import { useEffect, useMemo, useRef, useState } from "react";
import { getOrderRoute, getOrderTracking } from "@/api/orders.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useMapsSdkConfig } from "@/lib/ola-maps-env";
import { decodeEncodedPolyline } from "@/module/geo/lib/decode-polyline";
import { formatRouteSummary } from "@/module/geo/lib/format-route-summary";
import { OpenInMapsChip } from "@/module/geo/components/OpenInMapsChip";
import { OlaTrackingMap } from "@/module/geo/components/OlaTrackingMap";
import { openGoogleMapsTrip } from "@/module/geo/lib/open-google-maps";
import {
  ROUTE_REFETCH_MIN_MS,
  ROUTE_REFETCH_MOVE_M,
  ROUTE_RETRY_EMPTY_MS,
} from "@/module/geo/lib/trip-route-refetch";
import { trimRouteAhead, workerMovedMeters } from "@/module/geo/lib/trim-route-ahead";
import { Maximize2 } from "lucide-react";

const TRACKING_POLL_MS = 8000;
/** Live map only while decorator is driving; not before dispatch or after arrival. */
const MAP_LIVE_STATUSES = new Set(["EN_ROUTE"]);
const ROUTE_STATUSES = new Set(["EN_ROUTE"]);
const TRIP_FULFILLMENT_TYPES = new Set(["instant", "scheduled"]);

function isTripFulfillment(fulfillmentType) {
  return TRIP_FULFILLMENT_TYPES.has(fulfillmentType);
}

function hasVendorCoords(vendor) {
  return vendor?.latitude != null && vendor?.longitude != null;
}

function hasDestinationCoords(destination) {
  return destination?.latitude != null && destination?.longitude != null;
}

function TripMapChrome({ onExpand, onOpenMaps, openMapsClassName, showExpand = true }) {
  const canOpenMaps = Boolean(onOpenMaps);
  return (
    <>
      {canOpenMaps ? (
        <OpenInMapsChip
          onClick={onOpenMaps}
          className={cn("absolute bottom-3 left-3", openMapsClassName)}
        />
      ) : null}
      {showExpand && onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          className="absolute bottom-3 right-3 z-10 flex size-9 items-center justify-center rounded-full border border-border bg-background shadow-md transition-colors hover:bg-muted"
          aria-label="Expand map">
          <Maximize2 className="size-4 text-foreground" />
        </button>
      ) : null}
    </>
  );
}

function TripMapShell({ className, onExpand, onOpenMaps, children }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <TripMapChrome onExpand={onExpand} onOpenMaps={onOpenMaps} />
    </div>
  );
}

export function InstantTripTrackingMap({ orderId, orderStatus, fulfillmentType }) {
  const [tracking, setTracking] = useState(null);
  const [fullRoutePath, setFullRoutePath] = useState([]);
  const [routeMeta, setRouteMeta] = useState(null);
  const [routeIsFallback, setRouteIsFallback] = useState(false);
  const [status, setStatus] = useState("idle");
  const [mapExpanded, setMapExpanded] = useState(false);
  const lastRouteSuccessRef = useRef(0);
  const lastRouteAttemptRef = useRef(0);
  const lastRouteOriginRef = useRef({ lat: null, lng: null });
  const { config: sdkConfig, loading: sdkLoading, error: sdkError } = useMapsSdkConfig();

  const canPoll =
    isTripFulfillment(fulfillmentType) &&
    MAP_LIVE_STATUSES.has(orderStatus) &&
    Boolean(sdkConfig) &&
    !sdkError;

  const canFetchRoute =
    canPoll &&
    ROUTE_STATUSES.has(orderStatus) &&
    tracking?.liveTrackingEnabled &&
    tracking?.webMapEnabled &&
    hasVendorCoords(tracking?.vendor);

  const displayRoutePath = useMemo(() => {
    if (fullRoutePath.length < 2) return [];
    const vendor = tracking?.vendor;
    if (!hasVendorCoords(vendor)) return fullRoutePath;
    return trimRouteAhead(fullRoutePath, vendor.latitude, vendor.longitude);
  }, [fullRoutePath, tracking?.vendor?.latitude, tracking?.vendor?.longitude]);

  const connectorPath = useMemo(() => {
    if (displayRoutePath.length >= 2 || fullRoutePath.length >= 2) return [];
    if (!routeIsFallback) return [];
    const vendor = tracking?.vendor;
    const dest = tracking?.destination;
    if (!hasVendorCoords(vendor) || !hasDestinationCoords(dest)) return [];
    return [
      { lat: vendor.latitude, lng: vendor.longitude },
      { lat: dest.latitude, lng: dest.longitude },
    ];
  }, [displayRoutePath.length, fullRoutePath.length, routeIsFallback, tracking]);

  const mapProps = useMemo(
    () => ({
      tracking,
      routePath: displayRoutePath,
      fallbackPath: connectorPath,
      sdkConfig,
    }),
    [tracking, displayRoutePath, connectorPath, sdkConfig],
  );

  const etaLabel =
    routeMeta?.distanceMeters != null && routeMeta?.durationSeconds != null
      ? formatRouteSummary(routeMeta.distanceMeters, routeMeta.durationSeconds)
      : null;

  useEffect(() => {
    if (!canPoll || !orderId) return undefined;

    let cancelled = false;

    async function loadTracking() {
      try {
        const data = await getOrderTracking(orderId);
        if (!cancelled) {
          setTracking(data);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void loadTracking();
    const timer = setInterval(() => void loadTracking(), TRACKING_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [canPoll, orderId]);

  useEffect(() => {
    if (!ROUTE_STATUSES.has(orderStatus)) {
      setFullRoutePath([]);
      setRouteMeta(null);
      setRouteIsFallback(false);
      lastRouteOriginRef.current = { lat: null, lng: null };
      return;
    }
  }, [orderStatus]);

  useEffect(() => {
    if (!canFetchRoute || !orderId) return;

    const vendor = tracking.vendor;
    const now = Date.now();
    const routeEmpty = fullRoutePath.length < 2;
    const sinceSuccess = now - lastRouteSuccessRef.current;
    const sinceAttempt = now - lastRouteAttemptRef.current;
    const moved = workerMovedMeters(
      lastRouteOriginRef.current.lat,
      lastRouteOriginRef.current.lng,
      vendor.latitude,
      vendor.longitude,
    );

    const shouldRefetch =
      routeEmpty ||
      moved >= ROUTE_REFETCH_MOVE_M ||
      sinceSuccess >= ROUTE_REFETCH_MIN_MS;

    if (!shouldRefetch) return;
    if (routeEmpty && sinceAttempt < ROUTE_RETRY_EMPTY_MS) return;

    lastRouteAttemptRef.current = now;

    void getOrderRoute(orderId)
      .then((route) => {
        const decoded = decodeEncodedPolyline(route.encodedPolyline).map((p) => ({
          lat: p.lat,
          lng: p.lng,
        }));
        setFullRoutePath(decoded);
        setRouteMeta({
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
        });
        setRouteIsFallback(false);
        lastRouteSuccessRef.current = Date.now();
        lastRouteOriginRef.current = {
          lat: vendor.latitude,
          lng: vendor.longitude,
        };
      })
      .catch(() => {
        if (fullRoutePath.length < 2) {
          setFullRoutePath([]);
          if (hasVendorCoords(vendor) && hasDestinationCoords(tracking.destination)) {
            setRouteIsFallback(true);
          }
        }
      });
  }, [
    canFetchRoute,
    orderId,
    tracking?.vendor?.latitude,
    tracking?.vendor?.longitude,
    tracking?.destination?.latitude,
    tracking?.destination?.longitude,
    fullRoutePath.length,
  ]);

  if (!MAP_LIVE_STATUSES.has(orderStatus) || !isTripFulfillment(fulfillmentType)) {
    return null;
  }

  if (sdkLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-muted/30">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (sdkError || !sdkConfig) {
    return null;
  }

  if (!canPoll || !tracking?.webMapEnabled || !tracking?.liveTrackingEnabled) {
    return null;
  }

  if (status === "idle") {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-muted/30">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="text-sm text-muted-foreground">Live map is temporarily unavailable.</p>
    );
  }

  const handleOpenMaps = () => openGoogleMapsTrip(tracking);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Live trip</p>
        {etaLabel ? (
          <p className="text-xs font-medium text-muted-foreground">{etaLabel}</p>
        ) : null}
      </div>
      <TripMapShell
        className="h-52 w-full rounded-2xl border border-border"
        onExpand={() => setMapExpanded(true)}
        onOpenMaps={handleOpenMaps}>
        <OlaTrackingMap {...mapProps} mapInstanceKey="inline" className="size-full" />
      </TripMapShell>

      <Dialog open={mapExpanded} onOpenChange={setMapExpanded}>
        <DialogContent
          showCloseButton
          className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0 shadow-none ring-0 sm:max-w-none">
          <div className="relative h-full min-h-0 w-full flex-1 bg-background">
            {mapExpanded ? (
              <OlaTrackingMap
                {...mapProps}
                mapInstanceKey="fullscreen"
                className="absolute inset-0 size-full"
              />
            ) : null}
            <TripMapChrome
              showExpand={false}
              onOpenMaps={handleOpenMaps}
              openMapsClassName="bottom-6 left-4"
            />
          </div>
        </DialogContent>
      </Dialog>

      {routeIsFallback && displayRoutePath.length < 2 && connectorPath.length > 1 ? (
        <p className="text-xs text-muted-foreground">
          Road route is loading — line shows partner to your venue.
        </p>
      ) : null}
      {tracking?.vendor?.stale ? (
        <p className="text-xs text-muted-foreground">
          Live location is delayed — the decorator may have the app in the background. It should
          refresh when they open the partner app again.
        </p>
      ) : null}
    </div>
  );
}

/** Live customer map for instant and scheduled trips while en route. */
export const TripTrackingMap = InstantTripTrackingMap;
