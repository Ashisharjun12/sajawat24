/**
 * Trip map styling, matching the user app (app/user/module/geo/lib/trip-map-markers.ts).
 * Marker images (bike rider + location pin) live in map-assets.js.
 */

export const TRIP_MARKER_PX = 44;

/** Route line colour: the user app's text ink (app/user/lib/design-tokens colors.light.text). */
const ROUTE_INK = "#0F172A";

export const TRIP_ROUTE_PAINT = {
  casing: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 },
  line: { "line-color": ROUTE_INK, "line-width": 5, "line-opacity": 1 },
  fallback: { "line-color": ROUTE_INK, "line-width": 4, "line-opacity": 0.75 },
};
