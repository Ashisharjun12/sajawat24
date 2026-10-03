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
        ...buildOlaMapInitOptions(sdkConfig),
      })
      .then((map) => {
        if (disposed) {
          map?.remove?.();
          return;
        }
        mapRef.current = map;
        const emitCenter = () => {
          const c = map.getCenter();
          onCenterChange?.({ lat: c.lat, lng: c.lng });
        };
        let moveFrame = null;
        const emitCenterThrottled = () => {
          if (moveFrame != null) return;
          moveFrame = requestAnimationFrame(() => {
            moveFrame = null;
            emitCenter();
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
  }, [mapKey, sdkConfig?.styleUrl, sdkConfig?.apiKey, sdkConfig?.accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, zoom]);

  return <div ref={containerRef} className={className} />;
}
