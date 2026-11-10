import { useEffect, useRef } from "react";
import { OlaMaps } from "olamaps-web-sdk";
import { buildOlaMapInitOptions } from "@/module/geo/lib/ola-map-auth";

export function OlaPinMap({
  center,
  zoom,
  mapKey,
  sdkConfig,
  onCenterChange,
  liveCenterChange = false,
  /** false = a still preview (no pan / zoom). Callers should also add pointer-events-none. */
  interactive = true,
  /** Change to move the camera to `center` even when the coordinates did not change. */
  flyKey = 0,
  className = "size-full",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !sdkConfig?.styleUrl) return undefined;

    let disposed = false;
    const olaMaps = new OlaMaps({
      apiKey: sdkConfig.apiKey || "",
      accessToken: sdkConfig.accessToken || "",
    });

    void olaMaps
      .init({
        style: sdkConfig.styleUrl,
        container: el,
        center: [center.lng, center.lat],
        zoom,
        interactive,
        ...buildOlaMapInitOptions(sdkConfig),
      })
      .then((map) => {
        if (disposed) {
          map?.remove?.();
          return;
        }
        mapRef.current = map;
        // `userInteraction` is true when the move came from the user (drag / zoom), not from code.
        const emitCenter = (event) => {
          const c = map.getCenter();
          onCenterChange?.({ lat: c.lat, lng: c.lng, userInteraction: Boolean(event?.originalEvent) });
        };
        let moveFrame = null;
        const emitCenterThrottled = (event) => {
          if (moveFrame != null) return;
          moveFrame = requestAnimationFrame(() => {
            moveFrame = null;
            emitCenter(event);
          });
        };
        map.on("moveend", emitCenter);
        if (liveCenterChange) {
          map.on("move", emitCenterThrottled);
        }
        emitCenter();
      });

    return () => {
      disposed = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [mapKey, interactive, sdkConfig?.styleUrl, sdkConfig?.apiKey, sdkConfig?.accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, zoom, flyKey]);

  return <div ref={containerRef} className={className} />;
}
