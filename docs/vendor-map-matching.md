# Instant dispatch, maps, and vendor matching

## Overview

Instant bookings reuse the existing assignment and `acceptJob` flow. **PostgreSQL** is the source of truth; **Redis GEO** holds online vendors and live trip positions. **Google Maps** is used only on **mobile apps** for map display—not for vendor matching.

Scheduled bookings keep `fulfillment_type = scheduled` and never enter dispatch.

## Data model

| Store | Role |
|--------|------|
| `orders` | `fulfillment_type`, `dispatch_status`, delivery lat/lng, `scheduled_at` (ASAP SLA for instant) |
| `dispatch_offers` | Append-only offer audit per vendor round |
| `assignments` | Current vendor row; `source = system` for auto-offers |
| `platform_settings` | `instant.dispatch`, `instant.maps`, `instant.marketplace` |
| Redis | `vendors:online:{cityId}`, `vendor:{id}:meta`, `booking:{orderId}:location` |

## Dispatch pipeline (no Google)

1. Order reaches `CONFIRMED` (COD or paid online).
2. BullMQ job `dispatch:start` → `DispatchService.startDispatch`.
3. Candidates: Redis `GEOSEARCH` by radius wave + SQL eligibility (on duty, city, service radius).
4. Sequential offer: one vendor at a time; TTL job `dispatch:expire`; on decline/expire → `offerNext`.
5. Vendor accepts → existing `acceptJob` → `dispatch_status = accepted`.

Settings: `instant.dispatch` (`systemUserId` required for `assigned_by` on system assignments).

## HTTP APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/config/instant` | public | Dispatch + map flags for apps |
| GET | `/api/v1/orders/:id/tracking` | user | Destination + vendor last fix (respects `live_tracking_enabled`) |
| POST | `/api/v1/vendor/presence` | vendor | Heartbeat + GEOADD while on duty |
| POST | `/api/v1/vendor/presence/heartbeat` | vendor | Touch `last_seen` |
| POST | `/api/v1/vendor/jobs/:orderId/location` | vendor field | Trip GPS while `ASSIGNED` / `EN_ROUTE` / `ON_SITE` |

## Redis keys

- `vendors:online:{cityId}` — GEO set of vendor IDs (lon, lat member position).
- `vendor:{vendorId}:meta` — hash `last_seen`, `city_id`.
- `booking:{orderId}:location` — hash `latitude`, `longitude`, `heading`, `speed`, `at` (TTL 24h).

## BullMQ queues

- `dispatch` — `start`, `expire`, `expand` (radius wave).
- `presenceSweep` — worker + 60s interval removes stale GEO entries (`staleSec` from policy).

## Google usage rules

- **Backend**: no Maps SDK for matching or per-tick geocoding in dispatch.
- **Web**: live map optional (`webMapEnabled` in `instant.maps`); route via `GET /orders/:id/route`. See [maps-integration.md](./maps-integration.md).
- **Vendor / customer apps**: `expo-maps` MapView on tracking screen only; markers from `GET /orders/:id/tracking`; gate UI with `GET /config/instant`.

## Edge-case matrix (selected)

| ID | Condition | Behavior |
|----|-----------|----------|
| D1 | `instant.marketplace.enabled = false` | Checkout rejects instant carts |
| D2 | `instant.dispatch.enabled = false` | No dispatch jobs; manual assign only |
| D3 | Missing `systemUserId` | Dispatch marks exhausted; log error |
| D4 | No GEO candidates | Expand radius wave or `exhausted` |
| D5 | Offer TTL | Expire offer, decline pending assignment, next candidate |
| T1 | `live_tracking_enabled = false` | Tracking API may omit vendor position |
| T6 | Location older than 120s | `stale: true` on tracking response |
| P1 | Vendor off duty | Removed from GEO on duty patch |
| P2 | Stale heartbeat | Presence sweep `ZREM` from city GEO |

## Customer app readiness

No extra DB columns for week-2 map: use `PublicOrder` + `GET /orders/:id/tracking` + `GET /config/instant`.
