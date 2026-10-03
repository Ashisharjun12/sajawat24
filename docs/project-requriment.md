# Decory — Project Requirements, HLD, and Folder Structure

**Product:** Decory (repo: `decory`)  
**Type:** Three-sided marketplace for event decorations  
**Document status:** V1 locked (scheduled booking only)  
**Stack:** Node.js + Express + TypeScript modular monolith, PostgreSQL (Drizzle), Redis + BullMQ, Cloudflare R2

This file is the source of truth for what we are building, what we are not building yet, how the system is shaped, and which folders exist.

---

## 1. What this project is

Decory is **not** a standard e-commerce store. It is a live operations marketplace for booking event decorations (birthdays, anniversaries, and similar setups) in a city, with a decorator who arrives at a time slot, completes the setup, and closes the job with a completion OTP.

It combines:

- A **city-gated catalog** (serviceable pincodes, city prices, city banners) like a decoration booking site.
- **Scheduled on-site fulfillment** like Urban Company (a slot, a assigned professional, a completion handshake).
- A **money ledger** that survives Cash on Delivery (the vendor may collect cash and then owe the platform).

It is **three-sided**:

| Side | Client | Job |
|---|---|---|
| Customer | Web (later mobile) | Browse city catalog, book a slot, pay, track status, give completion OTP |
| Vendor (decorator) | Expo app | Register, wait for admin approval, see assigned jobs, complete with OTP, see wallet |
| Admin | Web dashboard | Cities, catalog, prices, vendor approval, **manual assign**, disputes, settings |

### 1.1 V1 vs later

| In V1 | Not in V1 |
|---|---|
| Scheduled booking only | Instant / Rapido-style fastest-finger dispatch |
| One city operationally, multi-city data model | PostGIS live tracking, H3, Socket.IO |
| Admin assigns vendor | Broadcast ping to all nearby vendors |
| Phone OTP + Google login | WhatsApp as booking channel |
| Razorpay + COD flag | Cashfree (add as a new provider file, do not rewrite checkout) |
| Append-only ledger + vendor COD cap | Full GSTR-8 automation, bank payouts engine |
| SMS + Expo/FCM push | Mastra agents on the booking path |
| Explicit pincode allowlist | Pincode numeric ranges, ML slot scoring |

Instant booking, live maps, and WebSockets are **reserved ports**, not V1 features.

### 1.2 Walking skeleton (must work end-to-end)

One city, one product, prepaid (Razorpay) plus one COD path:

1. Customer enters pincode → catalog for that city.
2. Adds product + add-ons → cart → scheduled slot (e.g. Friday 5 PM).
3. Pays online **or** chooses COD → order `CONFIRMED`.
4. Admin assigns an **ACTIVE** vendor with no calendar overlap.
5. Vendor sees the job, marks on-site, customer gives completion OTP.
6. Ledger posts: online split **or** COD liability on vendor.
7. If vendor COD dues exceed cap → cannot take **new** assignments.

If that loop is not reliable, nothing else ships.

---

## 2. Product requirements by side

### 2.1 Customer (web)

- Auth: phone OTP or Google OAuth.
- Catalog filtered by **serviceable pincode**; city-specific price; city homepage banners.
- Customize with mapped add-ons (balloon extras, cake, size/color variants).
- **Hybrid later; V1 = scheduled only** (book a decorator for a future datetime).
- Pay online, optional COD (privilege: cap + risk rules), promotional wallet **later**.
- Completion OTP: 4+ digit code, hashed, one-time. Customer shares it only when setup is acceptable.
- Post-booking: status tracking (REST), reviews/testimonials later, WhatsApp later.

### 2.2 Vendor (Expo)

- Register (name, phone, city, details). Locked until admin sets `ACTIVE`.
- V1 jobs come from **admin assignment**, not a city-wide accept race.
- Travel to location, complete decoration, enter completion OTP to close.
- Wallet: see balance / COD dues. If dues exceed cap, blocked from **new** jobs.
- Push notification when assigned (FCM/Expo). App job list is source of truth if push is late.

### 2.3 Admin (web)

- Cities + **explicit pincode list** (not start–end ranges).
- Categories, subcategories, products, city prices, product–addon maps.
- Banners per city; testimonials approve.
- Approve / block vendors. Assign scheduled orders. Reassign with audit.
- Coupons: **not V1**.
- Platform settings: kill switch for new bookings, COD max, operating hours. No `instant_enabled` in V1.

---

## 3. Engineering principles

1. **Modular monolith** — one Node process, one Postgres. Modules do not import each other’s repositories.
2. **Layer per entity** — `schema` → `repository` → `service` → `controller` → `route`. Zod HTTP lives in `dto.ts`.
3. **Singleton** — connection objects only (Postgres pool, Redis, BullMQ connection, SDK clients).
4. **Factory + Port (Strategy)** — Razorpay today, another PSP later: add `cashfree.provider.ts` and a factory case. **Do not change** `payment.port.ts` or checkout service.
5. **COD is not a payment provider** — it is `payment_method` on the order plus ledger lines.
6. **Money is integer paise** — never JavaScript floats for currency.
7. **Order status is a state machine** — illegal transitions throw.
8. **Idempotency** — webhooks, OTP verify, assign, complete.
9. **Ledger is append-only** — never `UPDATE` an amount; reverse with a new row.
10. **Realtime V1 = REST + push + jobs.** WebSocket adapter is a Noop. Booking never imports `socket.io`.
11. **Mastra** stays isolated under `src/mastra`. It is not on the money or dispatch path.
12. Other modules import `@/modules/<name>` (`index.ts`) only.

---

## 4. High-level design (HLD)

### 4.1 System context

```text
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│ Customer Web│   │ Vendor Expo  │   │ Admin Web   │
└──────┬──────┘   └──────┬───────┘   └──────┬──────┘
       │ REST+JWT        │ REST+JWT+Push    │ REST+JWT
       └─────────────────┼──────────────────┘
                         ▼
              ┌─────────────────────┐
              │  Express API (app)  │
              │  Modular monolith   │
              └──────────┬──────────┘
         ┌───────────────┼────────────────┐
         ▼               ▼                ▼
   PostgreSQL         Redis           BullMQ worker
   (Drizzle)       (OTP TTL,          (SMS, reminders,
                    idempotency)       webhook retry)
         │
         ▼
   R2 │ Razorpay │ SMS (MSG91) │ FCM/Expo
```

No Kafka. No microservices. No Socket.IO in V1.

### 4.2 Module map

```text
identity     who is logged in; vendor PENDING → ACTIVE
geo          city + pincode allowlist; assertServiceable
catalog      categories, products, add-ons, city prices
cms          city banners, testimonials
booking      cart → scheduled order + status machine
assignment   admin assign + calendar overlap
payments     intents, webhook, ledger, vendor wallet projection
fulfillment  completion OTP, job photos (R2 keys)
notifications SMS/push send API (others never call MSG91)
ops          settings, audit log
admin        mounts other modules’ admin routes; no tables
```

**Admin is a surface, not a domain.** `createProduct` lives in `catalog`, not in `admin`.

### 4.3 Request flow (V1 scheduled)

```text
User checkout
  → geo.assertServiceable(pincode)
  → catalog.priceQuote(product, city, addons)
  → booking.createOrder(scheduled_at)     PENDING_PAYMENT
  → payments.startCheckout (PaymentPort)
       │
       ├─ ONLINE: Razorpay webhook
       │     → booking.markConfirmed
       │     → notifications.bookingConfirmed
       └─ COD: booking.markConfirmed immediately (policy caps)
              → notifications.bookingConfirmed
  → admin assigns
       → assignment.assign(vendor)        overlap + ACTIVE + COD cap
       → booking → ASSIGNED
       → notifications.vendorNewJob (push + SMS)
  → vendor complete + OTP
       → fulfillment.verify
       → payments.ledger.postCompletion
       → booking → COMPLETED
```

### 4.4 Order state machine (V1)

```text
DRAFT → PENDING_PAYMENT → CONFIRMED → ASSIGNED → EN_ROUTE
                                              → ON_SITE → COMPLETED

CANCELLED  from DRAFT | PENDING_PAYMENT | CONFIRMED | ASSIGNED
DISPUTED   from ON_SITE (user refuses OTP) or post-complete (ops)

Illegal examples:
  PENDING_PAYMENT → COMPLETED
  COMPLETED → ASSIGNED
  complete OTP before ON_SITE
```

No `DISPATCHING` or `OFFERED_TO_FLEET` in V1.

### 4.5 Swappable providers (Port + Factory)

```text
infrastructure/payment/payment.port.ts     ← never delete methods
infrastructure/payment/payment.factory.ts  ← PAYMENT_PROVIDER=razorpay|cashfree
infrastructure/payment/razorpay.provider.ts
infrastructure/payment/cashfree.provider.ts   ← add later only

Same for: sms, storage, push, realtime
```

**PaymentPort (stable):**

- `createIntent({ orderId, amountPaise, receipt })`
- `verifyWebhook(headers, rawBody)`
- `refund({ providerRef, amountPaise, idempotencyKey })`

Checkout service depends on `PaymentFactory.getProvider()` only.

**RealtimePort V1:** `NoopRealtime` (or FCM). Later `SocketRealtime` implements the same port.

### 4.6 Patterns (use these, not more)

| Pattern | Where |
|---|---|
| Modular monolith | `src/modules/*` |
| Repository / Service / Controller / Route | each entity folder |
| Singleton | Postgres, Redis, queue connection, SDK clients |
| Factory | `DbFactory`, `PaymentFactory`, `SmsFactory`, … |
| Strategy (port-adapter) | payment, sms, storage, push, realtime |
| State machine | `booking/domain/order-status.ts` |
| Idempotency | webhook, OTP, assign, complete |
| Outbox via BullMQ | SMS, reminders, webhook retry |
| Integer money | `shared/money/paise.ts` |

**Do not use:** generic `BaseRepository<T>`, Kafka event bus, abstract-factory trees, Socket.IO as default transport, microservices.

### 4.7 Transport decision

| Need | V1 | Later |
|---|---|---|
| Catalog, checkout, OTP complete | REST | REST |
| Order status | REST (poll / pull-to-refresh) | optional WebSocket |
| Vendor new job | Expo/FCM push + GET jobs | still push-first |
| Live vendor map | out of scope | GPS + realtime port |
| Instant accept race | out of scope | then short-lived offers |

### 4.8 Data ownership

| Data | Owner module |
|---|---|
| users, vendors, sessions, login OTP | identity |
| cities, pincodes | geo |
| categories, products, addons, city_prices | catalog |
| banners, testimonials | cms |
| carts, orders, order_items | booking |
| assignments | assignment |
| payment_intents, ledger_entries, wallets | payments |
| completion otps, job photos | fulfillment |
| platform_settings, audit_log | ops |

Join tables stay with the child entity (`product_addons` in `addon.schema.ts`).

### 4.9 HTTP gateway (one process)

```text
/api/v1/auth/*                 identity
/api/v1/me/*
/api/v1/geo/*
/api/v1/catalog/*
/api/v1/home/*
/api/v1/cart/*
/api/v1/orders/*
/api/v1/payments/webhook

/api/v1/vendor/auth/*
/api/v1/vendor/jobs/*
/api/v1/vendor/wallet/*

/api/v1/admin/*                admin.route mounts domain admin routes
```

---

## 5. File convention

Each **entity** folder uses the same names:

| File | Owns |
|---|---|
| `<entity>.schema.ts` | Drizzle table + inferred types |
| `<entity>.repository.ts` | SQL only |
| `<entity>.service.ts` | rules, transactions, other modules via `index.ts` |
| `<entity>.dto.ts` | Zod HTTP (only if the entity has HTTP) |
| `<entity>.controller.ts` | req → service → res (only if HTTP) |
| `<entity>.route.ts` | path + middleware (only if HTTP) |

Skip repository when there is no table (e.g. `auth` uses `user.repository`).  
Skip HTTP files when the entity is internal (ledger, calendar, sessions, pricing, audit, SMS).

One `*.route.ts` per entity. Use `requireRole` for admin vs user vs vendor. Do not split `product.user.route.ts` / `product.admin.route.ts` unless the file is huge.

---

## 6. Folder structure (this repo)

```text
decory/
├── docs/
│   └── project-requriment.md          ← this file
├── apps/                              ← later: web, admin, vendor (Expo)
└── backend/
    ├── drizzle.config.ts
    ├── package.json
    └── src/
        ├── server.ts
        ├── app.ts
        ├── config/
        ├── db/
        │   ├── schema.ts              ← re-exports module schemas as they land
        │   └── migrations/
        ├── utils/logger.ts
        ├── mastra/                    ← isolated AI; unused in V1 booking
        ├── infrastructure/
        │   ├── database/              ← IDbProvider, DbFactory, Postgres singletons
        │   │   └── provider/
        │   │       ├── postgres.singleton.ts
        │   │       ├── postgres-pool.singleton.ts
        │   │       └── redis.singleton.ts
        │   ├── queue/
        │   ├── payment/               ← port + factory + razorpay
        │   ├── sms/
        │   ├── email/                 ← port + smtp
        │   ├── storage/
        │   ├── push/
        │   ├── whatsapp/              ← port + noop
        │   └── realtime/              ← port + noop
        ├── shared/
        │   ├── errors/
        │   ├── middlewares/
        │   ├── money/paise.ts
        │   └── http/pagination.ts
        ├── worker/
        │   └── index.ts
        └── modules/
            ├── identity/
            ├── geo/
            ├── catalog/
            ├── cms/
            ├── booking/
            ├── assignment/
            ├── payments/
            ├── fulfillment/
            ├── notifications/
            ├── ops/
            └── admin/
```

### 6.1 Modules and submodules

**identity**

```text
modules/identity/
├── index.ts
├── auth/          auth.service, dto, controller, route
├── users/         user.schema, repository, service, dto, controller, route
├── vendors/       vendor.* (all six)
└── sessions/      session.schema, repository, service   (no HTTP)
```

**geo**

```text
cities/     city.* (all six)
pincodes/   pincode.* (all six)   GET /geo/resolve?pincode=
```

**catalog**

```text
categories/  category.* (all six)
products/    product.* (all six)
addons/      addon.* (all six)    product_addons join in addon.schema
pricing/     city-price.schema, repository, service   (no HTTP)
```

**cms**

```text
banners/        banner.* (all six)
testimonials/   testimonial.* (all six)
```

**booking**

```text
domain/order-status.ts
carts/     cart.* (all six)
orders/    order.* (all six)
items/     order-item.schema, repository   (no service/HTTP)
slots/     slot.service.ts                 (no table in V1)
```

**assignment**

```text
assignments/  assignment.* (all six)
calendar/     calendar.service.ts
jobs/         assignment.job.ts
```

**payments**

```text
intents/   payment-intent.* (all six)
ledger/    ledger-entry.schema, repository, ledger.service   (no HTTP)
wallets/   wallet.* (all six)   or derive from ledger later
```

**fulfillment**

```text
otps/     completion-otp.* (all six)
photos/   photo.* (all six)
```

**notifications**

```text
index.ts, schema.ts, container.ts
notification.service.ts, notification.repository.ts
policy/events.ts
templates/template.service.ts
preferences/preference.service.ts
jobs/relay.job.ts, deliver.job.ts
```

**ops**

```text
settings/  setting.* (all six) + notification-channels.ts
           key notify.channels → { sms, email, push, inApp, whatsapp }
audit/     audit-log.schema, repository, audit.service   (no HTTP)
```

**admin**

```text
index.ts
admin.route.ts    mounts other admin routers; no schema
```

---

## 7. Jobs (BullMQ)

| Queue | When | Module |
|---|---|---|
| `notify.relay` | outbox → channel queues | notifications |
| `sms` | critical SMS / OTP | notifications |
| `notify.email` | SMTP | notifications |
| `notify.push` | Expo (skipped until implemented) | notifications |
| `notify.in_app` | inbox insert | notifications |
| `assignment.reminder` | T-24h / T-4h before slot | assignment |
| `payments.webhook-retry` | PG callback failed | payments |
| `ledger.post-on-complete` | after OTP verify (if not in same TX) | payments |

No `broadcast-nearby-vendors` queue.

Worker entry: `backend/src/worker/index.ts` (`npm run worker`).

---

## 8. Edge cases (V1 must handle)

**Identity:** OTP rate limit; hashed one-time OTP; Google vs existing phone; vendor not ACTIVE → 403; refresh-token reuse revoke.

**Geo/catalog:** unknown pincode → empty catalog; snapshot city/price on the order; missing city price → fail, no silent fallback; add-on not mapped → reject; lead time vs slot.

**Booking:** idempotent checkout; cart pincode must match; past slot rejected; price snapshot at pay.

**Payments:** webhook before response; duplicate webhook; amount mismatch; COD ≠ Razorpay provider; refund = reversing ledger rows.

**Assignment:** 409 if already assigned / overlap / inactive vendor / COD cap; reassign only with audit.

**Fulfillment:** OTP brute force lock; no complete before ON_SITE; dispute if user refuses OTP; photos in R2 not in Postgres.

**Ledger:** complete twice is a no-op; this job can finish even if cap is exceeded; next assign is blocked.

**Infra:** Redis down → OTP login fails closed; worker down → API still accepts bookings; status change uses `WHERE status = expected`.

---

## 9. Build order

1. Folder tree (this change).
2. Ports + factories (payment, sms, storage, push, realtime).
3. Identity phone OTP.
4. Geo resolve.
5. Catalog by pincode.
6. Cart → order `PENDING_PAYMENT`.
7. Razorpay + webhook → `CONFIRMED`.
8. Admin assign + vendor job list.
9. Completion OTP → ledger.
10. SMS on confirmed / assigned.

Then: CMS banners, ops settings, coupons, instant dispatch, WebSockets, Mastra on product path.

---

## 10. Decision lock

1. V1 is **scheduled booking only**.
2. Transport V1 is **REST + BullMQ + FCM**. Realtime port is Noop.
3. New PSP = new `*.provider.ts` + factory case. Port and checkout service stay.
4. COD = order method + ledger, not a payment provider.
5. Admin module has **no tables**.
6. Pincodes are an **allowlist**, not numeric ranges.
7. Other modules import public `index.ts` only.

When this document and the folder tree disagree, **this document wins** — then fix the folders.
