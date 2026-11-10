import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixedIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { currentPositionMessage, getCurrentPositionForMap } from "@/lib/current-position";
import { getMapPinIconUrl } from "@/lib/map-env";
import { OlaPinMap } from "@/module/geo/components/OlaPinMap";
import { PlacesAddressAutocomplete } from "@/module/geo/components/PlacesAddressAutocomplete";
import { useMapsSdkConfig } from "@/lib/use-maps-sdk-config";
import { usePinnedLocation } from "@/module/geo/hooks/use-pinned-location";
import { INDIA_CENTER, isInsideIndiaBounds } from "@/module/geo/lib/india-map";

/**
 * Add address, step 1: put the pin on the exact spot. Finds the device location on open (unless a
 * spot is already known), reads the address under the pin and only lets the user continue when we
 * deliver there.
 *
 * `initialSpot` = {lat, lng} for a known spot (editing, or coming back via "Change").
 * `savedSpot` = the last selected address, used only when the device location is unavailable.
 */
export function AddressMapStep({
  initialSpot = null,
  savedSpot = null,
  contextCityId = null,
  contextCityName = "",
  onConfirm,
}) {
  const { config: sdkConfig, loading: sdkLoading, error: sdkError } = useMapsSdkConfig();
  const pinUrl = getMapPinIconUrl();
  const known = Boolean(initialSpot);

  // `target` is where the camera is sent; `pin` is where the map centre currently is. They are
  // separate on purpose: feeding the reported centre back as the target would fight the user's drag.
  const [target, setTarget] = useState(() => initialSpot ?? savedSpot ?? INDIA_CENTER);
  const [zoom, setZoom] = useState(known ? 17 : savedSpot ? 14 : 5);
  const [flyKey, setFlyKey] = useState(0);
  const [pin, setPin] = useState(target);
  const [picked, setPicked] = useState(known);
  /** "finding" = still looking for the device location. */
  const [phase, setPhase] = useState(known ? "located" : "finding");
  const [notice, setNotice] = useState(null);
  const [searchLine, setSearchLine] = useState("");
  const [locating, setLocating] = useState(false);
  /** Set as soon as the user searches, drags or taps locate: a late automatic result must not override it. */
  const userMovedRef = useRef(false);

  const pinned = usePinnedLocation({
    latitude: pin.lat,
    longitude: pin.lng,
    enabled: picked,
    contextCityId,
    contextCityName,
  });

  const flyTo = useCallback((lat, lng, nextZoom = 17) => {
    setTarget({ lat, lng });
    setZoom(nextZoom);
    setFlyKey((k) => k + 1);
    setPicked(true);
  }, []);

  const takeOver = useCallback(() => {
    userMovedRef.current = true;
    setPhase("located");
    setNotice(null);
  }, []);

  // Stable on purpose: the map component keeps the callback from its first render.
  const handleCenterChange = useCallback(
    ({ lat, lng, userInteraction }) => {
      setPin({ lat, lng });
      if (userInteraction) {
        takeOver();
        setPicked(true);
      }
    },
    [takeOver],
  );

  // On open: find the device location (the browser asks for permission). Falls back to the last
  // selected address, or the whole-India view, with a short explanation.
  useEffect(() => {
    if (known) return undefined;
    let cancelled = false;
    void (async () => {
      const result = await getCurrentPositionForMap({
        onApproximate: ({ latitude, longitude }) => {
          if (!cancelled && !userMovedRef.current) flyTo(latitude, longitude, 16);
        },
      });
      if (cancelled || userMovedRef.current) return;
      setPhase("located");
      if (result.ok) {
        setNotice(null);
        flyTo(result.latitude, result.longitude);
        return;
      }
      setNotice(result.reason);
      if (savedSpot) flyTo(savedSpot.lat, savedSpot.lng, 16);
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per mount: the parent remounts this step each time it is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function useCurrentLocation() {
    takeOver();
    setLocating(true);
    try {
      const result = await getCurrentPositionForMap();
      if (result.ok) flyTo(result.latitude, result.longitude);
      else setNotice(result.reason);
    } finally {
      setLocating(false);
    }
  }

  function confirm() {
    if (pinned.status !== "ready") return;
    onConfirm({
      latitude: pin.lat,
      longitude: pin.lng,
      address: pinned.line,
      areaTitle: pinned.title,
      pincode: pinned.pincode,
      city: pinned.city,
    });
  }

  const findingYou = phase === "finding" && pinned.status === "idle";
  const canConfirm = pinned.status === "ready";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-[260px] flex-1 touch-none overflow-hidden bg-muted">
        {sdkLoading ? (
          <div className="flex size-full items-center justify-center">
            <Spinner className="size-8" />
          </div>
        ) : sdkError || !sdkConfig ? (
          <div className="flex size-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Map is unavailable right now. Please try again in a moment.
          </div>
        ) : (
          <>
            <OlaPinMap
              mapKey={0}
              sdkConfig={sdkConfig}
              center={target}
              zoom={zoom}
              flyKey={flyKey}
              onCenterChange={handleCenterChange}
              className="size-full"
            />

            {/* No pin or tooltip while we are still looking for the user. */}
            {!findingYou ? (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <img
                  src={pinUrl}
                  alt=""
                  className="size-12 -translate-y-6 object-contain drop-shadow-md"
                />
                {picked ? (
                  <div className="absolute -translate-y-20 rounded-xl bg-slate-900 px-4 py-2 text-center shadow-lg">
                    <p className="text-sm font-semibold text-white">Order will be delivered here</p>
                    <p className="text-xs text-white/75">Place the pin to your exact location</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="absolute inset-x-3 top-3 z-20">
              <PlacesAddressAutocomplete
                value={searchLine}
                onChange={setSearchLine}
                onPlaceResolved={({ latitude, longitude }) => {
                  takeOver();
                  setSearchLine("");
                  if (!isInsideIndiaBounds(latitude, longitude)) {
                    toast.add({ title: "Select a location within India", type: "error" });
                    return;
                  }
                  flyTo(latitude, longitude);
                }}
                placeholder="Search for apartment, street name…"
                aria-label="Search for a place"
                className="h-12 rounded-xl border-border bg-background px-4 text-sm shadow-md"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute bottom-3 right-3 z-10 size-11 rounded-full shadow-md"
              onClick={() => void useCurrentLocation()}
              disabled={locating}
              aria-label="Use my current location"
            >
              {locating ? <Spinner className="size-4" /> : <LocateFixedIcon className="size-5" />}
            </Button>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {notice ? (
          <p className="mb-3 rounded-lg bg-primary/10 px-3 py-2.5 text-xs leading-relaxed text-foreground">
            {currentPositionMessage(notice)}
          </p>
        ) : null}

        <div aria-live="polite">
          {findingYou || pinned.status === "locating" ? (
            <div className="flex flex-col gap-2" role="status">
              <div className="h-5 w-2/3 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
              <p className="text-xs text-muted-foreground">
                {findingYou ? "Finding your location…" : "Finding this place…"}
              </p>
            </div>
          ) : pinned.status === "idle" ? (
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-foreground">Set your delivery location</p>
              <p className="text-sm text-muted-foreground">
                Search above, use your current location, or move the map to place the pin.
              </p>
            </div>
          ) : pinned.status === "error" ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-lg font-semibold text-foreground">Couldn't read this spot</p>
              <p className="text-sm text-destructive">{pinned.message}</p>
              <button
                type="button"
                className="self-start text-sm font-semibold text-primary underline-offset-4 hover:underline"
                onClick={pinned.retry}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <MapPinIcon className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-foreground">{pinned.title}</p>
                {pinned.line ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{pinned.line}</p>
                ) : null}
                {pinned.status === "blocked" ? (
                  <p className="mt-1.5 text-sm font-medium text-destructive">{pinned.message}</p>
                ) : pinned.city ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pinned.city.name}
                    {pinned.pincode ? ` · ${pinned.pincode}` : ""}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <Button type="button" className="mt-4 h-12 w-full" disabled={!canConfirm} onClick={confirm}>
          Confirm Location
        </Button>
      </div>
    </div>
  );
}
