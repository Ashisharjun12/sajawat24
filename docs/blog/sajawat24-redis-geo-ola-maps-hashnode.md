# Hashnode publish settings

Copy everything below the line into Hashnode → New post.

| Field | Value |
|-------|--------|
| **Title** | How We Built Instant Decoration Dispatch on Sajawat24: Redis GEO, Ola Maps (Not Google), and a Secure Maps BFF |
| **Subtitle** | Problems we hit building a hyperlocal marketplace in India—and the architecture that fixed them. |
| **Slug** | `sajawat24-redis-geo-ola-maps-instant-dispatch` |
| **SEO title** | Sajawat24: Redis GEO Instant Dispatch + Ola Maps BFF (Why Not Google) |
| **SEO description** | How Sajawat24 built instant decoration dispatch with Redis GEOSEARCH, secured Ola Maps behind a Node BFF, and avoided Google Maps key sprawl across web and Expo. |
| **Tags** | nodejs, redis, react-native, architecture, webdev |
| **Publication** | [How The Internet Works ?](https://ashishdev21.hashnode.dev) (or your personal blog) |

> **Note:** Hashnode MCP/API publishing requires **Hashnode Pro** on the target publication. Until upgraded, paste this markdown in the editor and add cover images at the slots marked below.

---

I'm building **Sajawat24**—a city-based platform to book home and event decoration (packages, add-ons, scheduled slots, and **Instant** bookings when customers need a decorator quickly).

This post is the engineering story: the **problems that hurt us early**, how we **solved** them, and **why we chose Ola Maps over Google Maps**—with concrete steps you can reuse on Node, React web, and Expo.

---

## TL;DR

| Problem | What we did |
|--------|-------------|
| Matching nearby vendors in seconds | **Redis `GEOADD` / `GEOSEARCH`** per city—not a maps Distance Matrix loop |
| Map API keys leaking in web/mobile bundles | **Backend-for-frontend (BFF)** proxy + `GET /maps/sdk-config` |
| Google Maps cost & key sprawl across 4 surfaces | **Ola Maps** on the server; **MapLibre** on native; Ola web SDK on customer web |
| “Is this PIN even deliverable?” before dispatch | **City + PIN serviceability** gate before Redis runs |
| Stale “online” vendors | **Heartbeat + presence sweep** removing dead GEO entries |
| Duplicate direction API calls during tracking | **Redis route cache** (~120s TTL) keyed by order + rounded coords |

---

## What Sajawat24 needs from location tech

1. **Browse & checkout** — customer picks a city, validates PIN, confirms address on a map pin.
2. **Instant dispatch** — when an order is confirmed, find **on-duty decorators near the delivery point** and offer the job sequentially.
3. **Live trip** — while the vendor is **assigned / en route / on site**, stream GPS to the customer (when flags allow).
4. **Vendor onboarding** — shop address search + pin confirm on the partner app.

That is **four different map touchpoints** (web, customer app, vendor app, admin). Doing that with **raw Google Maps keys in every client** was a path we did not want.

---

## Problem 1: Instant matching cannot depend on a maps provider

### What went wrong

Early designs treated “nearest vendor” like a maps problem: call a **distance matrix** or directions API for every candidate on every dispatch wave. That is:

- **Slow** at offer time (hundreds of ms × N vendors).
- **Expensive** at scale (billing per element).
- **Fragile** (rate limits during peak booking hours).

Decoration trips are also **longer** than food delivery—a vendor can be **on site for hours**, so “busy” state matters as much as distance.

### How we solved it

We split **matching** from **maps UX**:

- **PostgreSQL** — source of truth: orders, assignments, onboarding status, COD/ledger rules, “already on a trip.”
- **Redis geospatial** — who is **online right now** in a city.

When a vendor goes on duty, we **`GEOADD`** into `vendors:online:{cityId}` with `(longitude, latitude, vendorId)`.

When dispatch runs, we **`GEOSEARCH`** from the customer’s delivery coordinates:

- `FROMLONLAT` → `BYRADIUS` (km) → `ASC` → `WITHDIST` → `COUNT`

Redis implements this with a **geohash-style index** internally—you get radius search without maintaining your own geohash library in app code.

Then **SQL filters** trim the GEO list: on duty, active onboarding, not busy on another trip, business rules (e.g. COD exposure), pincode/service radius.

**Ola is not in this loop.** Maps APIs are for humans (search, pin, polyline)—not for offer ranking.

> **📸 COVER + Figure 1** — System context: Customer web + apps → Node API → PostgreSQL, Redis GEO, Ola Maps (separate paths for dispatch vs maps UX). Size 1200×630 for cover.

---

## Problem 2: Map API keys in the browser and mobile apps

### What went wrong

Putting `VITE_GOOGLE_MAPS_KEY` or mobile keys in client env files means:

- Keys are **extractable** from APK/IPA and browser bundles.
- You need **separate restrictions** per platform (HTTP referrer vs Android SHA vs iOS bundle)—easy to misconfigure.
- Rotating a key means **rebuilding every app**.

We have **web + two Expo apps**. One leaked key becomes a billing incident.

### How we solved it: maps BFF on Node

All Ola credentials live **only on the backend**:

- `OLA_MAPS_CLIENT_ID` + `OLA_MAPS_CLIENT_SECRET` (OAuth client credentials), **or**
- `OLA_MAPS_API_KEY` (server-side REST + style URL mode)

Public routes (no secrets in clients):

- `GET /api/v1/maps/sdk-config` — style URL + short-lived access token (OAuth) or key mode for web SDK init
- `GET /api/v1/maps/places/autocomplete`
- `POST /api/v1/maps/places/:placeId`
- `GET /api/v1/maps/reverse`
- Order **route** endpoints for customer/vendor during live trips

**Web** only needs `VITE_API_URL`. **Expo apps** only need `EXPO_PUBLIC_API_URL`.

OAuth tokens are cached in memory with expiry skew; each upstream call gets an `X-Request-Id` for tracing.

> **📸 Figure 2** — Trust boundary diagram: clients (no secrets) vs API server (OAuth/API key) → Ola Maps.

---

## Problem 3: Why Ola Maps instead of Google Maps?

We are not anti-Google—**Google is excellent globally**. For **Sajawat24 in India**, Ola Maps was the better product fit **for our stack**:

| Factor | Google Maps (typical) | Ola Maps (our choice) |
|--------|----------------------|------------------------|
| **Billing model** | Per-session / per-SKU; matrix & places add up fast with 3 clients | Server-controlled usage; one integration surface |
| **Key exposure** | Encourages client SDK keys for Places/Maps JS | REST + vector tiles; we proxy everything |
| **India address UX** | Strong, but pricing & compliance overhead for a startup marketplace | Places autocomplete/details aligned with our deployment region |
| **Native maps** | react-native-maps + Google provider ties you to Google on device | **MapLibre** + Ola vector style from `sdk-config`—same server auth story |
| **Dispatch matching** | Temptation to use Distance Matrix | We **refuse** to use any maps vendor for matching—Redis GEO only |

**Important:** We still use **Firebase / `google-services.json`** for push notifications on Android—that is unrelated to **map display**. Do not confuse “Google on the device for FCM” with “Google Maps as our map stack.”

---

## Problem 4: Serviceability vs “nearest vendor”

### What went wrong

Dispatch would run for orders that checkout should never allow—wrong city, denied PIN, inactive market—wasting Redis work and confusing customers.

### How we solved it

**Geo serviceability first:**

- Active **city**
- Valid **6-digit PIN**; optional pincode table can deny specific codes
- Checkout asserts **city + PIN** match the cart market

`GET /geo/resolve?pincode=&cityId=` returns deliverable + reason for UX.

Only after that do Instant flows use map pin + marketplace + dispatch flags.

> **📸 Figure 3 (optional)** — Flowchart: PIN → geo resolve → checkout → Instant dispatch.

---

## Problem 5: Live tracking without polluting the GEO set

### What went wrong

Trip GPS is **per order**; vendor “online for offers” is **per city**. Mixing them in one Redis structure creates stale data and wrong dispatch radius.

### How we solved it

- **Online for dispatch:** `vendors:online:{cityId}` (GEO set)
- **Trip position:** `booking:{orderId}:location` hash (`lat`, `lng`, `heading`, `speed`, `at`) with **24h TTL**
- Vendor **presence** heartbeats update `vendor:{id}:meta` (`last_seen`, `city_id`)

Customer polls tracking; route polylines go through cached directions (`route:{orderId}:roundedLat:roundedLng`, ~120s TTL).

> **📸 Figure 4** — Sequence diagram: CONFIRMED → BullMQ dispatch → GEOSEARCH → SQL filter → offer → accept → GPS → tracking.

---

## Problem 6: Dispatch stuck in “searching”

### What went wrong

Workers crash, vendors go offline without logout, offers expire—orders can linger in `searching`.

### How we solved it

- **Sequential offers** with TTL jobs (`dispatch:expire`, radius **expand** waves)
- **Presence sweep** on an interval—remove vendors from GEO when heartbeat is stale
- **Reconcile job** to exhaust dispatch when searching is too old

Postgres stays authoritative; Redis is a **hint layer** that must be cleaned.

---

## Implementation steps: Ola Maps on Sajawat24

### Step 1 — Backend credentials

1. Create Ola Maps project credentials in the Ola developer console.
2. On the API server set **either**:
   - `OLA_MAPS_CLIENT_ID` + `OLA_MAPS_CLIENT_SECRET`, **or**
   - `OLA_MAPS_API_KEY`
3. Restrict server IPs in the Ola console in production.
4. Restart API; smoke `GET /api/v1/maps/sdk-config`.

### Step 2 — Implement provider + proxy routes

- Single maps provider module for autocomplete, place details, reverse geocode, directions.
- Token helper: `POST https://api.olamaps.io/auth/v1/token` with `grant_type=client_credentials`, cache `access_token`.
- Never forward client-supplied API keys.

### Step 3 — Customer web

1. Remove any `VITE_*_MAPS_*` keys from the repo.
2. Debounced autocomplete → your `/maps/places/autocomplete`.
3. Map confirm + live trip: load **Ola web SDK** using payload from `/maps/sdk-config` only.

### Step 4 — Customer & vendor Expo (MapLibre)

1. Use `@maplibre/maplibre-react-native`.
2. Fetch `mapStyle` from `/maps/sdk-config`.
3. Attach **Bearer** (or key mode) to `api.olamaps.io` tile requests via transform hook—**no Ola secret in the app**.
4. Use a **dev/production build** (MapLibre is not a full Expo Go story).

### Step 5 — Vendor onboarding & jobs

- Address bottom sheet → places proxy → pin on map → save lat/lng.
- On duty: `POST /vendor/presence` → **GEOADD**.
- On trip: `POST /vendor/jobs/:orderId/location` while status is assigned / en route / on site.

### Step 6 — Wire Instant dispatch (independent of maps vendor)

1. Order `CONFIRMED` → enqueue `dispatch:start`.
2. Candidates = **GEOSEARCH** + SQL eligibility.
3. Offer one vendor; on decline/timeout → next.
4. Accept → existing assignment flow.

### Step 7 — Cutover checklist

- [ ] `sdk-config` returns style + auth
- [ ] Autocomplete + place details return India PIN where possible
- [ ] One Instant order: pin → pay → offer → accept → en route → tracking + route line
- [ ] Confirm **no** map secrets in web bundle (search built assets for `api_key` / map provider keys)

---

## Architecture at a glance

```
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ Sajawat24   │  │ Sajawat24    │  │ Vendor app  │
│ web         │  │ customer app │  │ (Expo)      │
└──────┬──────┘  └──────┬───────┘  └──────┬──────┘
       │                │                  │
       └────────────────┼──────────────────┘
                        ▼
              ┌─────────────────┐
              │ Node API (BFF)  │
              │ /maps/*         │
              │ orders/dispatch │
              └────────┬────────┘
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   PostgreSQL      Redis GEO     Ola Maps
   orders/         online +      Places/Routes/
   assignments     trip hashes   vector tiles
```

> **📸 Figure 5** — Redis key cheat sheet infographic.

---

## Lessons (if you are building something similar)

1. **Scope GEO by city**—one key per market keeps radius search predictable.
2. **Never use maps APIs inside dispatch loops**—use Redis GEO + relational rules.
3. **One maps BFF** beats three copied SDK integrations.
4. **Serviceability before geography**—save money and support tickets.
5. **Separate “online for jobs” from “GPS on active order”**—different Redis shapes, different TTLs.

---

## What is next for Sajawat24

We are rolling **Instant** out city by city, tightening live tracking on the customer app, and writing follow-ups on **Cashfree payments**, **BullMQ notifications**, and vendor onboarding.

If this helped you, leave a comment with what you are building—I am happy to compare notes on Redis GEO vs matrix APIs.

---

*Written by Ashish ([@ashishraj12](https://hashnode.com/@ashishraj12)) while shipping **Sajawat24**—book decoration for celebrations at home.*
