# Notifications module

Templates, preferences, notify + outbox, BullMQ workers. Kafka is not used.

## Public API (`@/modules/notifications`)

- `notificationService.assertCanSend(event)`
- `notificationService.notify({ event, userId?, recipient?, data, idempotencyKey, scheduledAt? })`
- Admin template router, user preference router

Identity OTP:

```text
assertCanSend(LOGIN_OTP) → saveOtp → notify(LOGIN_OTP, phone, otp)
```

Booking transactional SMS (requires `recipient.phone`; normalized to E.164 `+91` at dispatch):

All SMS `to` addresses are passed through `normalizePhoneForSms()` in `notification.service` (10-digit checkout numbers and existing `+91` account phones both work).

| Event | Recipient | Channels |
|-------|-----------|----------|
| `BOOKING_CONFIRMED` | Customer (`userId` + phone) | email + sms + push + in_app |
| `BOOKING_ASSIGNED` | Customer | email + sms + push + in_app — on vendor **accept** (`booking-assigned:{orderId}`) and when a **field worker** is assigned/self-assigned (`booking-field-worker:{orderId}:{memberId}`) |
| `VENDOR_EN_ROUTE` | Customer | email + sms + push + in_app |
| `VENDOR_ON_SITE` | Customer | email + sms + push + in_app |
| `DELIVERY_CODE` | Customer phone / email | email + sms (+ whatsapp per prefs) — **no** push / in_app (secret code) |
| `BOOKING_COMPLETED` | Customer | email + sms + push + in_app |
| `BOOKING_REMINDER` | Customer | push + in_app (+ email/sms per policy) |
| `CHAT_MESSAGE` | Customer / vendor | push + in_app |
| `VENDOR_NEW_JOB` | Vendor phone | push + in_app + sms |
| `PAYOUT_PAID` | Vendor phone + email | email + sms + push + in_app |
| `PAYOUT_FAILED` | Vendor phone + email | email + sms + push + in_app |

Track links in SMS use `WEB_APP_ORIGIN` + `/account/bookings/{orderId}`.

**India production:** register matching DLT templates with MSG91 before live SMS. See **[sms.md](./sms.md)**. **WhatsApp-first launch:** **[message-service.md](./message-service.md)** — `WHATSAPP_PROVIDER=msg91`, admin sms off / whatsapp on. Dev uses `SMS_PROVIDER=dev` (worker logs only, no send).

## Tables

| Table | Role |
|---|---|
| `notification_templates` | key, type, channel, locale, editable, isActive |
| `notification_template_versions` | immutable versions; one active |
| `user_notification_preferences` | per-user channel + promo flags |
| `notifications` | send intent + status |
| `notification_deliveries` | provider attempts |
| `notifications_outbox` | TX-safe handoff to BullMQ |
| `notification_inbox` | in-app rows |

Seed: `login_otp` (sms + whatsapp), `booking_confirmed` (email + sms + push + in_app + whatsapp), customer lifecycle keys with push/in_app — run `pnpm db:seed:templates` (idempotent) after deploy or when adding channels.

Deploy: `pnpm db:migrate` then `pnpm db:seed:templates` (idempotent). Source of truth: `src/db/seeds/notification-templates.seed.ts`. Generate SQL: `pnpm db:seed:templates:sql`.

## Policy

[`policy/events.ts`](../src/modules/notifications/policy/events.ts): channel routing per event. `LOGIN_OTP` → sms + whatsapp; `assertCanSend` requires at least one phone channel enabled. Booking events → sms/whatsapp optional (skipped if phone missing).

## Queues

| Queue | Worker |
|---|---|
| `notify.relay` | claim outbox, enqueue channel job; sweep every 5s |
| `sms` | dev / **msg91** (DLT) |
| `notify.whatsapp` | noop / **msg91 Flow** |
| `notify.email` | SMTP (`SMTP_USER` is From) |
| `notify.push` | Expo |
| `notify.in_app` | insert inbox |

## Layout

```text
modules/notifications/
  schema.ts
  container.ts
  notification.service.ts
  notification.repository.ts
  policy/events.ts
  lib/render.ts
  templates/template.service.ts
  preferences/preference.service.ts
  jobs/relay.job.ts, deliver.job.ts
```

Infrastructure: `sms/`, `email/` (smtp only), `push/`, `whatsapp/` (noop or msg91 Flow).

Admin catalog: `GET /admin/settings/message-service/catalog` — see Message service settings tab.

## Env

- `SMS_PROVIDER=dev|msg91` — India production SMS: **msg91** + DLT; full setup in **[sms.md](./sms.md)**
- `WHATSAPP_PROVIDER=noop|msg91` — WhatsApp via MSG91 Flow; **[message-service.md](./message-service.md)**
- `WEB_APP_ORIGIN` — customer booking track URLs in SMS/email (e.g. `http://localhost:5174` dev)

## Manual test

1. Run API + `pnpm worker:dev` with `SMS_PROVIDER=dev`.
2. Place a booking → worker logs `DevSmsProvider` with booking confirmed SMS.
3. Admin assigns vendor → vendor SMS logged.
4. Vendor accepts → customer assigned SMS logged.
