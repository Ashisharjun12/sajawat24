# Notifications

Domain module: templates, user preferences, `notify()`, Postgres outbox, BullMQ. No Kafka. Providers stay in `infrastructure/`.

Internals: [`backend/docs/notifications.md`](../backend/docs/notifications.md).

## Runtime

| Process | Why |
|---|---|
| API | `notify()`, prefs, admin templates, channel flags |
| Worker | `notify.relay`, `sms`, `notify.email`, `notify.push`, `notify.in_app` |
| Postgres | templates, prefs, notifications, outbox, inbox |
| Redis | BullMQ + `pref:{userId}` cache |

Base: `http://localhost:3000/api/v1`.

## Call path

```text
identity.notify({ event: LOGIN_OTP, recipient.phone, data.otp })
  → template + platform flags + prefs
  → notifications + notifications_outbox  (one TX)
  → BullMQ notify.relay
  → sms | notify.email | …
  → SmsFactory / EmailFactory (SMTP)
```

Rules:

- Domain modules import `@/modules/notifications` only.
- Providers send `{ to, body }` or `{ to, subject, html }`.
- Platform kill switches always win.
- Transactional (OTP) ignores marketing opt-out. OTP does not need `userId`.
- Promotional requires user pref + platform flag.
- No public `POST /notifications`. Booking/identity call `notificationService.notify()`.

## Env

```text
SMS_PROVIDER=dev|msg91
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=          # From address
SMTP_PASSWORD=
PUSH_PROVIDER=expo
WHATSAPP_PROVIDER=noop
```

There is no `EMAIL_PROVIDER=dev`. SMTP is required to send email.

## Admin HTTP (Bearer + role `admin`)

| Method | Path |
|---|---|
| GET | `/admin/settings/notifications` |
| PATCH | `/admin/settings/notifications` |
| GET | `/admin/notification-templates` |
| PATCH | `/admin/notification-templates/:id` |
| POST | `/admin/notification-templates/:id/versions` |

`login_otp` has `editable: false`. Version POST returns 403.

Admin UI: **Settings → Notifications** (channel switches + templates table).

## User HTTP (Bearer)

| Method | Path |
|---|---|
| GET | `/user/notification-preferences` |
| PUT | `/user/notification-preferences` |

Missing row: transactional channels on, promo off, WhatsApp off.

## OTP

1. `assertCanSend("LOGIN_OTP")` — SMS platform off → **503** `sms notifications disabled`. OTP not stored.
2. Redis `saveOtp`.
3. `notify` → outbox → `sms` queue.
4. Worker skips send if SMS was turned off after enqueue.

## Out of this slice

- Booking/assignment `notify()` calls (`booking_confirmed` template is seeded only)
- Expo send + device tokens (push jobs marked `SKIPPED`)
- WhatsApp Meta (skipped / noop)
- Customer prefs page (API only)
