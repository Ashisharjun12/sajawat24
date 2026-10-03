import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OlaMaps } from "olamaps-web-sdk";
import { buildOlaMapInitOptions } from "@/module/geo/lib/ola-map-auth";
import { TRIP_ROUTE_PAINT } from "@/module/geo/lib/trip-map-markers";

const ROUTE_SOURCE = "decory-trip-route";
const ROUTE_CASING_LAYER = "decory-trip-route-casing";
const ROUTE_LAYER = "decory-trip-route-line";
const FALLBACK_SOURCE = "decory-trip-fallback";
const FALLBACK_CASING_LAYER = "decory-trip-fallback-casing";
const FALLBACK_LAYER = "decory-trip-fallback-line";
const TRIP_POINTS_SOURCE = "decory-trip-points";
const TRIP_POINTS_LAYER = "decory-trip-points-circle";

function tripPointsGeoJson(tracking) {
  const features = [];
  const dest = tracking?.destination;
  const vendor = tracking?.vendor;
  if (dest?.latitude != null && dest?.longitude != null) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [dest.longitude, dest.latitude] },
      properties: { kind: "customer" },
    });
  }
  if (vendor?.latitude != null && vendor?.longitude != null) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [vendor.longitude, vendor.latitude] },
      properties: { kind: "worker" },
    });
  }
  return { type: "FeatureCollection", features };
}

function upsertTripPointLayers(map, tracking) {
  const data = tripPointsGeoJson(tracking);
  if (!data.features.length) return;
  if (map.getSource(TRIP_POINTS_SOURCE)) {
    map.getSource(TRIP_POINTS_SOURCE).setData(data);
    return;
  }
  map.addSource(TRIP_POINTS_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: TRIP_POINTS_LAYER,
    type: "circle",
    source: TRIP_POINTS_SOURCE,
    paint: {
      "circle-radius": 12,
      "circle-color": [
        "match",
        ["get", "kind"],
        "worker",
        "#F5C518",
        "customer",
        "#1A1A1A",
        "#888888",
      ],
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff",
    },
  });
}

function upsertRouteSource(map, sourceId, routePath) {
  if (!map || routePath?.length < 2) return false;
  const coordinates = routePath.map((p) => [p.lng, p.lat]);
  const geojson = {
    type: "Feature",
    geometry: { type: "LineString", coordinates },
  };
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojson);
  } else {
    map.addSource(sourceId, { type: "geojson", data: geojson });
  }
  return true;
}

function ensureRouteLayers(map, sourceId, casingId, lineId, casingPaint, linePaint) {
  if (!map.getSource(sourceId)) return;
  if (!map.getLayer(casingId)) {
    map.addLayer({
      id: casingId,
      type: "line",
      source: sourceId,
      paint: casingPaint,
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }
  if (!map.getLayer(lineId)) {
    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: linePaint,
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }
}

function clearRouteStack(map, sourceId, casingId, lineId) {
  if (!map) return;
  if (map.getLayer(lineId)) map.removeLayer(lineId);
  if (map.getLayer(casingId)) map.removeLayer(casingId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

function collectBoundsPoints(tracking, routePath, fallbackPath) {
  const points = [];
  const dest = tracking?.destination;
  const vendor = tracking?.vendor;
  if (dest?.latitude != null && dest?.longitude != null) {
    points.push([dest.longitude, dest.latitude]);
  }
  if (vendor?.latitude != null && vendor?.longitude != null) {
    points.push([vendor.longitude, vendor.latitude]);
  }
  const line = routePath?.length > 1 ? routePath : fallbackPath;
  if (line?.length) {
    line.forEach((p) => points.push([p.lng, p.lat]));
  }
  return points;
}

function fitMapToTrip(map, tracking, routePath, fallbackPath) {
  const points = collectBoundsPoints(tracking, routePath, fallbackPath);
  if (points.length < 1 || !map?.fitBounds) return;
  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    minLng = Math.min(minLng, points[i][0]);
    maxLng = Math.max(maxLng, points[i][0]);
    minLat = Math.min(minLat, points[i][1]);
    maxLat = Math.max(maxLat, points[i][1]);
  }
  const minSpan = 0.0025;
  if (maxLng - minLng < minSpan) {
    const c = (maxLng + minLng) / 2;
    minLng = c - minSpan / 2;
    maxLng = c + minSpan / 2;
  }
  if (maxLat - minLat < minSpan) {
    const c = (maxLat + minLat) / 2;
    minLat = c - minSpan / 2;
    maxLat = c + minSpan / 2;
  }
  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: 56, maxZoom: 15, duration: 400 },
  );
}

function addTripMarker(olaMaps, map, lngLat, kind) {
  const wrap = document.createElement("div");
  wrap.style.width = "44px";
  wrap.style.height = "44px";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";

  const dot = document.createElement("div");
  dot.style.width = "34px";
  dot.style.height = "34px";
  dot.style.borderRadius = "17px";
  dot.style.border = "3px solid #fff";
  dot.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
  dot.style.backgroundColor = kind === "worker" ? "#F5C518" : "#1A1A1A";
  dot.style.display = "flex";
  dot.style.alignItems = "center";
  dot.style.justifyContent = "center";

  if (kind === "customer") {
    const inner = document.createElement("div");
    inner.style.width = "11px";
    inner.style.height = "11px";
    inner.style.background = "#fff";
    inner.style.borderRadius = "2px";
    dot.appendChild(inner);
  } else {
    const arrow = document.createElement("div");
    arrow.style.width = "0";
    arrow.style.height = "0";
    arrow.style.borderLeft = "6px solid transparent";
    arrow.style.borderRight = "6px solid transparent";
    arrow.style.borderBottom = "10px solid #fff";
    arrow.style.marginTop = "-2px";
    dot.appendChild(arrow);
  }
  wrap.appendChild(dot);

  try {
    const marker = olaMaps.addMarker({ element: wrap, anchor: "center" });
    marker.setLngLat(lngLat).addTo(map);
    return marker;
  } catch {
    const marker = olaMaps.addMarker({ color: kind === "worker" ? "#F5C518" : "#1A1A1A" });
    marker.setLngLat(lngLat).addTo(map);
    return marker;
  }
}

export function OlaTrackingMap({
  tracking,
  routePath,
  fallbackPath = [],
  sdkConfig,
  className = "size-full",
  /** Remount map when switching inline vs fullscreen layout. */
  mapInstanceKey = "default",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const olaMapsRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const center = useMemo(() => {
    const vendor = tracking?.vendor;
    const dest = tracking?.destination;
    if (vendor?.latitude != null && vendor?.longitude != null) {
      return { lat: vendor.latitude, lng: vendor.longitude };
    }
    if (dest?.latitude != null && dest?.longitude != null) {
      return { lat: dest.latitude, lng: dest.longitude };
    }
    return { lat: 20.5937, lng: 78.9629 };
  }, [tracking]);

  const applyMapContent = useCallback(() => {
    const map = mapRef.current;
    const olaMaps = olaMapsRef.current;
    if (!map || !olaMaps) return;

    markersRef.current.forEach((m) => m?.remove?.());
    markersRef.current = [];

    const dest = tracking?.destination;
    const vendor = tracking?.vendor;
    if (dest?.latitude != null && dest?.longitude != null) {
      markersRef.current.push(
        addTripMarker(olaMaps, map, [dest.longitude, dest.latitude], "customer"),
      );
    }
    if (vendor?.latitude != null && vendor?.longitude != null) {
      markersRef.current.push(
        addTripMarker(olaMaps, map, [vendor.longitude, vendor.latitude], "worker"),
      );
    }

    const paintRoute = () => {
      if (routePath?.length > 1) {
        if (upsertRouteSource(map, ROUTE_SOURCE, routePath)) {
          ensureRouteLayers(
            map,
            ROUTE_SOURCE,
            ROUTE_CASING_LAYER,
            ROUTE_LAYER,
            TRIP_ROUTE_PAINT.casing,
            TRIP_ROUTE_PAINT.line,
          );
        }
        clearRouteStack(map, FALLBACK_SOURCE, FALLBACK_CASING_LAYER, FALLBACK_LAYER);
      } else if (fallbackPath?.length > 1) {
        clearRouteStack(map, ROUTE_SOURCE, ROUTE_CASING_LAYER, ROUTE_LAYER);
        if (upsertRouteSource(map, FALLBACK_SOURCE, fallbackPath)) {
          ensureRouteLayers(
            map,
            FALLBACK_SOURCE,
            FALLBACK_CASING_LAYER,
            FALLBACK_LAYER,
            { ...TRIP_ROUTE_PAINT.casing, "line-opacity": 0.65, "line-width": 7 },
            TRIP_ROUTE_PAINT.fallback,
          );
        }
      } else {
        clearRouteStack(map, ROUTE_SOURCE, ROUTE_CASING_LAYER, ROUTE_LAYER);
        clearRouteStack(map, FALLBACK_SOURCE, FALLBACK_CASING_LAYER, FALLBACK_LAYER);
      }
      upsertTripPointLayers(map, tracking);
      fitMapToTrip(map, tracking, routePath, fallbackPath);
    };

    if (map.isStyleLoaded()) paintRoute();
    else map.once("load", paintRoute);
  }, [tracking, routePath, fallbackPath]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !sdkConfig?.styleUrl) return undefined;

    let disposed = false;
    setMapReady(false);
    const olaMaps = new OlaMaps({
      apiKey: sdkConfig.apiKey || "",
      accessToken: sdkConfig.accessToken || "",
    });
    olaMapsRef.current = olaMaps;

    void olaMaps
      .init({
        style: sdkConfig.styleUrl,
        container: el,
        center: [center.lng, center.lat],
        zoom: 13,
        ...buildOlaMapInitOptions(sdkConfig),
      })
      .then((map) => {
        if (disposed) {
          map?.remove?.();
          return;
        }
        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        setMapReady(false);
      });

    return () => {
      disposed = true;
      setMapReady(false);
      markersRef.current.forEach((m) => m?.remove?.());
      markersRef.current = [];
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [sdkConfig?.styleUrl, sdkConfig?.apiKey, sdkConfig?.accessToken, mapInstanceKey]);

  useEffect(() => {
    if (!mapReady) return;
    applyMapContent();
  }, [mapReady, applyMapContent]);

  return <div ref={containerRef} className={className} />;
}
