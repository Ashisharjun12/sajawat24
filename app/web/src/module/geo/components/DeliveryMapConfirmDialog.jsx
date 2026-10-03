import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { getDeviceCoords } from "@/lib/geolocation";
import { reverseGeocodeLocation } from "@/lib/reverse-geocode";
import { getMapPinIconUrl, useMapsSdkConfig } from "@/lib/ola-maps-env";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  INDIA_CENTER,
  isInsideIndiaBounds,
} from "@/module/geo/lib/india-map";
import { OlaPinMap } from "@/module/geo/components/OlaPinMap";

const DEFAULT_ZOOM_GPS = 17;
const DEFAULT_ZOOM_PIN = 15;
const DEFAULT_ZOOM_FALLBACK = 5;
const REVERSE_GEO_DEBOUNCE_MS = 550;

function MapPinConfirmBody({
  mapKey,
  initialCenter,
  initialZoom,
  pinUrl,
  sdkConfig,
  onUseCurrentLocation,
  locating,
  onConfirm,
  onCancel,
  confirmLabel,
  saving,
  onMapCenterChange,
  liveCenterChange,
}) {
  const centerRef = useRef(initialCenter);

  useEffect(() => {
    centerRef.current = initialCenter;
  }, [initialCenter, mapKey]);

  const handleConfirm = () => {
    const lat = centerRef.current.lat;
    const lng = centerRef.current.lng;
    if (!isInsideIndiaBounds(lat, lng)) {
      toast.add({ title: "Select a location within India", type: "error" });
      return;
    }
    onConfirm({ latitude: lat, longitude: lng });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[min(48vh,380px)] w-full overflow-hidden rounded-xl border border-border">
        <OlaPinMap
          mapKey={mapKey}
          sdkConfig={sdkConfig}
          center={initialCenter}
          zoom={initialZoom}
          liveCenterChange={liveCenterChange}
          onCenterChange={(next) => {
            centerRef.current = next;
            onMapCenterChange?.(next);
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <img
            src={pinUrl}
            alt=""
            className="size-12 -translate-y-6 object-contain drop-shadow-md"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute right-3 top-3 z-10 gap-1.5 shadow-md"
          onClick={onUseCurrentLocation}
          disabled={locating || saving}
        >
          {locating ? <Spinner className="size-3.5" /> : <LocateFixed className="size-3.5" />}
          Current location
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Move the map — the address above updates to match the pin.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Back
        </Button>
        <Button type="button" className="flex-1" onClick={handleConfirm} disabled={saving}>
          {saving ? <Spinner className="size-4" /> : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export function DeliveryMapConfirmDialog({
  open,
  onOpenChange,
  initialLatitude,
  initialLongitude,
  addressSummary,
  confirmLabel = "Save location",
  saving = false,
  closeOnConfirm = true,
  livePreview = false,
  onLiveLocationChange,
  onConfirm,
}) {
  const [ready, setReady] = useState(false);
  const [mapCenter, setMapCenter] = useState(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM_FALLBACK);
  const [loading, setLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [previewLine, setPreviewLine] = useState("");
  const [previewPlaceName, setPreviewPlaceName] = useState("");
  const [previewMeta, setPreviewMeta] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const reverseTimerRef = useRef(null);
  const wasOpenRef = useRef(false);
  const pinUrl = getMapPinIconUrl();
  const { config: sdkConfig, loading: sdkLoading, error: sdkError } = useMapsSdkConfig();

  const resolveInitialView = useCallback(async () => {
    setLoading(true);
    try {
      const coords = await getDeviceCoords();
      if (isInsideIndiaBounds(coords.latitude, coords.longitude)) {
        setMapCenter({ lat: coords.latitude, lng: coords.longitude });
        setMapZoom(DEFAULT_ZOOM_GPS);
      } else {
        setMapCenter(INDIA_CENTER);
        setMapZoom(DEFAULT_ZOOM_FALLBACK);
      }
    } catch {
      setMapCenter(INDIA_CENTER);
      setMapZoom(DEFAULT_ZOOM_FALLBACK);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setReady(false);
      if (reverseTimerRef.current) window.clearTimeout(reverseTimerRef.current);
      return;
    }
    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (!justOpened) return;

    setPreviewLine(addressSummary?.line ?? "");
    setPreviewPlaceName("");
    setPreviewMeta(addressSummary?.meta ?? "");
    setMapKey((k) => k + 1);
    if (initialLatitude != null && initialLongitude != null) {
      setMapCenter({ lat: initialLatitude, lng: initialLongitude });
      setMapZoom(DEFAULT_ZOOM_PIN);
      setReady(true);
      return;
    }
    void resolveInitialView();
  }, [open, initialLatitude, initialLongitude, resolveInitialView, addressSummary?.line, addressSummary?.meta]);

  const scheduleReverseGeocode = useCallback(
    (lat, lng) => {
      if (!livePreview || !onLiveLocationChange) return;
      if (reverseTimerRef.current) window.clearTimeout(reverseTimerRef.current);
      reverseTimerRef.current = window.setTimeout(() => {
        setGeoLoading(true);
        void reverseGeocodeLocation(lat, lng)
          .then((result) => {
            if (result.placeName) setPreviewPlaceName(result.placeName);
            else setPreviewPlaceName("");
            if (result.address) setPreviewLine(result.address);
            const metaParts = [result.cityName, result.pincode].filter(Boolean);
            if (metaParts.length) setPreviewMeta(metaParts.join(" · "));
            onLiveLocationChange({
              latitude: lat,
              longitude: lng,
              address: result.address || "",
              placeName: result.placeName,
              pincode: result.pincode,
              cityName: result.cityName,
            });
          })
          .catch(() => {
            onLiveLocationChange({ latitude: lat, longitude: lng });
          })
          .finally(() => setGeoLoading(false));
      }, REVERSE_GEO_DEBOUNCE_MS);
    },
    [livePreview, onLiveLocationChange],
  );

  function handleMapCenterChange(next) {
    scheduleReverseGeocode(next.lat, next.lng);
  }

  function handleClose() {
    if (saving) return;
    onOpenChange(false);
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const coords = await getDeviceCoords();
      if (!isInsideIndiaBounds(coords.latitude, coords.longitude)) {
        toast.add({ title: "Your location is outside India", type: "error" });
        return;
      }
      setMapCenter({ lat: coords.latitude, lng: coords.longitude });
      setMapZoom(DEFAULT_ZOOM_GPS);
      setMapKey((k) => k + 1);
    } catch {
      toast.add({ title: "Could not get your location", type: "error" });
    } finally {
      setLocating(false);
    }
  }

  if (sdkError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Map unavailable</DialogTitle>
            <DialogDescription>
              Maps are not configured on the server. Set OLA_MAPS_CLIENT_ID and OLA_MAPS_CLIENT_SECRET
              (or OLA_MAPS_API_KEY) in the API environment.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const showSummary = addressSummary || previewLine;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Adjust delivery pin</DialogTitle>
          <DialogDescription>
            Drag the map so the pin matches your door. Save when it looks right.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
          {showSummary ? (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">
                {geoLoading
                  ? "Finding this place…"
                  : previewPlaceName || addressSummary?.label || "Delivery address"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {geoLoading ? "Move the pin over your building or venue" : previewMeta || addressSummary?.meta}
              </p>
              <p className="mt-2 text-foreground">{previewLine || addressSummary?.line}</p>
              {addressSummary?.landmark ? (
                <p className="mt-1 text-muted-foreground">Near {addressSummary.landmark}</p>
              ) : null}
            </div>
          ) : null}
          {!ready || loading || sdkLoading || !sdkConfig ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : (
            <MapPinConfirmBody
              mapKey={mapKey}
              sdkConfig={sdkConfig}
              initialCenter={mapCenter}
              initialZoom={mapZoom}
              pinUrl={pinUrl}
              locating={locating}
              liveCenterChange={livePreview}
              onMapCenterChange={handleMapCenterChange}
              onUseCurrentLocation={() => void handleUseCurrentLocation()}
              confirmLabel={confirmLabel}
              saving={saving}
              onConfirm={(coords) => {
                onConfirm?.(coords);
                if (closeOnConfirm && !saving) handleClose();
              }}
              onCancel={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
