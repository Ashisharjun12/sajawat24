/** Decory trip map markers — worker (partner GPS) vs customer venue. */

export const TRIP_MARKER_PX = 44;

/** Brand primary ~ hsl(48 96% 53%) */
const AMBER = '#F5C518';
const AMBER_DEEP = '#E8A317';
const INK = '#1A1A1A';

export function workerMarkerSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TRIP_MARKER_PX}" height="${TRIP_MARKER_PX}" viewBox="0 0 44 44" fill="none">
  <circle cx="22" cy="22" r="20" fill="${AMBER}" fill-opacity="0.22"/>
  <circle cx="22" cy="22" r="15" fill="#fff" stroke="#E5E7EB" stroke-width="1.5"/>
  <circle cx="22" cy="22" r="11" fill="url(#wG)"/>
  <path d="M22 14.5L26.2 24.5H17.8L22 14.5Z" fill="#fff"/>
  <defs>
    <linearGradient id="wG" x1="14" y1="11" x2="30" y2="33" gradientUnits="userSpaceOnUse">
      <stop stop-color="${AMBER_DEEP}"/>
      <stop offset="1" stop-color="${AMBER}"/>
    </linearGradient>
  </defs>
</svg>`;
}

export function customerMarkerSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TRIP_MARKER_PX}" height="${TRIP_MARKER_PX}" viewBox="0 0 44 44" fill="none">
  <circle cx="22" cy="22" r="20" fill="${INK}" fill-opacity="0.12"/>
  <circle cx="22" cy="22" r="15" fill="#fff" stroke="#E5E7EB" stroke-width="1.5"/>
  <circle cx="22" cy="22" r="11" fill="${INK}"/>
  <rect x="17.5" y="17.5" width="9" height="9" rx="1.5" fill="#fff"/>
</svg>`;
}

export function tripMarkerDataUrl(kind: 'worker' | 'customer'): string {
  const svg = kind === 'worker' ? workerMarkerSvg() : customerMarkerSvg();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Route line paint (MapLibre) — simple dark line + subtle casing. */
export const TRIP_ROUTE_PAINT = {
  casing: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.9 },
  line: { 'line-color': INK, 'line-width': 5, 'line-opacity': 1 },
  fallback: { 'line-color': INK, 'line-width': 4, 'line-opacity': 0.75 },
} as const;
