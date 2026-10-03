# Maps integration

Ola Maps on the backend (Places proxy, directions, OAuth), server-issued SDK config for customer web maps, and Redis GEO dispatch unchanged.

See also: [geo-serviceability.md](./geo-serviceability.md), [vendor-map-matching.md](./vendor-map-matching.md).

## Environment variables

| Surface | Variable | Usage |
|---------|----------|--------|
| Web | `VITE_API_URL` | Proxies `/maps/*` (no map keys in the browser) |
| Web | `VITE_MAP_PIN_ICON_URL` | Branded center pin on map confirm |
| Backend | `OLA_MAPS_CLIENT_ID` + `OLA_MAPS_CLIENT_SECRET` | OAuth → Bearer on Places/Routes + short-lived token for web SDK |
| Backend | `OLA_MAPS_API_KEY` | Alternative: `?api_key=` on REST and SDK style URL |
| Vendor app | `EXPO_PUBLIC_API_URL` only | MapLibre + `GET /maps/sdk-config` (no client Ola key) |

Restrict server credentials by IP in production.

## Ola APIs

| Feature | Endpoint |
|---------|----------|
| Directions (trip line) | `POST /routing/v1/directions/basic?origin=lat,lng&destination=lat,lng` |
| Autocomplete | `GET /places/v1/autocomplete?input=` (+ optional `location=lat,lng`) |
| Place details | `GET /places/v1/details?place_id=` |
| Map tiles (web SDK) | `…/tiles/vector/v1/styles/default-light-standard/style.json` (+ Bearer or `api_key`) |

Each request should send `X-Request-Id` (UUID). Backend adds this automatically.

**Server auth:** If `OLA_MAPS_CLIENT_ID` and `OLA_MAPS_CLIENT_SECRET` are set, the backend fetches `POST https://api.olamaps.io/auth/v1/token` (`grant_type=client_credentials`, `scope=openid`) and uses `Authorization: Bearer <token>` on Places/Routes. The web app loads `GET /api/v1/maps/sdk-config` for `styleUrl` + `accessToken` (OAuth) or `apiKey` (key mode).

## Backend HTTP

- `GET /api/v1/maps/sdk-config` — Ola Web SDK init (auth from server env only)
- `GET /api/v1/maps/places/autocomplete?input=&sessionToken=&location=lat,lng`
- `POST /api/v1/maps/places/:placeId` — body `{ sessionToken? }`
- `GET /api/v1/orders/:id/route` — customer; instant trip + `liveTrackingEnabled`
- `GET /api/v1/vendor/jobs/:orderId/route` — partner

Route Redis cache: `route:{orderId}:{roundedLat}:{roundedLng}` TTL 120s.

Dispatch matching stays **Redis GEO + haversine** (not Ola Distance Matrix unless enabled in a future admin flag).

## Web UX

- Address line: debounced **backend** autocomplete + place details.
- Map confirm + live trip map: **olamaps-web-sdk** via `/maps/sdk-config` (no `VITE_OLA_*` keys).
- Booking detail map when admin enables **Web map** and **Live tracking**.

## Vendor app (MapLibre)

- Trip map: `@maplibre/maplibre-react-native` with `mapStyle` from `GET /api/v1/maps/sdk-config` (OAuth Bearer via `TransformRequestManager` on `api.olamaps.io`).
- Requires a **dev or production native build** (not Expo Go).
- Rebuild after native dependency changes: `cd app/vendor && npm install && npx expo prebuild --clean` then `npx expo run:android` or an EAS development build.

## Vendor onboarding

- Shop address: bottom-sheet search → pin confirm on `OlaMapView`; Places via `/api/v1/maps/places/*`.

## Live GPS (field worker only)

- Foreground pings when `ASSIGNED` / `EN_ROUTE` / `ON_SITE`; optional **background** updates + Android foreground service while `EN_ROUTE`.
- Customer polls `GET /orders/:id/tracking`; route via `GET /orders/:id/route` or vendor `GET /vendor/jobs/:orderId/route`.

## Expo push after vendor native rebuild

Push uses `extra.eas.projectId` in `app.json` — MapLibre-only rebuilds do not invalidate tokens unless Android package or iOS bundle id changes. After installing a new build: log in, grant notifications, trigger `VENDOR_NEW_JOB` on a physical device.

## Cutover checklist

1. Set `OLA_MAPS_CLIENT_ID` + `OLA_MAPS_CLIENT_SECRET` (or `OLA_MAPS_API_KEY`) on backend; restart API.
2. Smoke: `GET /maps/sdk-config`, autocomplete, place details, one instant route, map pin on address save.

## Manual instant test

1. Admin: instant marketplace + dispatch; maps flags (live tracking, web map).
2. Web: city, instant cart, address autocomplete, map pin, checkout.
3. Vendor owner accepts; assign field worker; worker **En route** → tracking + polyline.
