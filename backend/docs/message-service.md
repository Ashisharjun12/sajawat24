# Message service — MSG91 One API (WhatsApp-first)

Decory sends **WhatsApp** through **MSG91 One API Flow** (`POST /api/v5/flow/`). There is **no direct Meta Cloud API** in the backend — templates and numbers are managed in the MSG91 dashboard (Embedded Signup).

**SMS (DLT)** remains on the separate v5 path when the admin **SMS** channel is on. See **[sms.md](./sms.md)**.

Admin **Settings → Message service** lists copy-paste template text, Meta categories, and env key names. Platform toggles are under **Notifications**.

---

## Phase 1 — WhatsApp-only (recommended at launch)

1. Complete MSG91 KYC and fund wallet.
2. **WhatsApp → Numbers → Add Number** → Facebook Embedded Signup → Meta Business verification.
3. Create **Meta-approved templates** using text from the admin **WhatsApp** sub-tab (Authentication for OTP, Utility for booking/payout).
4. **One API → Add Flow** — one flow per notification event (~12). Add a WhatsApp step; map Flow variables (`VAR1`, `VAR2`, …) to template placeholders in order.
5. Copy each **Flow ID** into `.env` as `MSG91_FLOW_<EVENT>` (see catalog / `.env.sample`).
6. Set `WHATSAPP_PROVIDER=msg91`, `SMS_PROVIDER=msg91` (auth key still required), `MSG91_AUTH_KEY`, `MSG91_SENDER_ID` (often required on account even for WA-only flows).
7. Admin: **WhatsApp on**, **SMS off** until DLT templates are approved.
8. Run API + **worker**; test OTP and one booking event.

## Phase 2 — Add SMS

When DLT templates are approved:

- Set `MSG91_TEMPLATE_*` env vars and turn **SMS on** in admin, **or**
- Add an SMS step to each MSG91 Flow and keep using Flow for both channels.

Decory’s worker still uses **v5 SMS** (`msg91.provider.ts`) for the `sms` queue unless you migrate flows to include SMS steps only.

---

## Env

```env
WHATSAPP_PROVIDER=msg91
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_FLOW_LOGIN_OTP=
MSG91_FLOW_BOOKING_CONFIRMED=
# … one MSG91_FLOW_* per event (admin Message service catalog)

# Optional override
MSG91_FLOW_API_URL=https://api.msg91.com/api/v5/flow/
```

| Notification event | Env var | Variable order (`VAR1`, `VAR2`, …) |
|--------------------|---------|-------------------------------------|
| `LOGIN_OTP` | `MSG91_FLOW_LOGIN_OTP` | otp |
| `BOOKING_CONFIRMED` | `MSG91_FLOW_BOOKING_CONFIRMED` | customerName, orderRef, scheduledAt, trackUrl |
| `BOOKING_ASSIGNED` | `MSG91_FLOW_BOOKING_ASSIGNED` | vendorName, orderRef, scheduledAt, trackUrl |
| `VENDOR_EN_ROUTE` | `MSG91_FLOW_VENDOR_EN_ROUTE` | vendorName, orderRef, trackUrl |
| `VENDOR_ON_SITE` | `MSG91_FLOW_VENDOR_ON_SITE` | vendorName, orderRef |
| `DELIVERY_CODE` | `MSG91_FLOW_DELIVERY_CODE` | orderRef, code |
| `BOOKING_COMPLETED` | `MSG91_FLOW_BOOKING_COMPLETED` | orderRef |
| `VENDOR_NEW_JOB` | `MSG91_FLOW_VENDOR_NEW_JOB` | orderRef, scheduledAt, address |
| `VENDOR_JOB_ASSIGNED` | `MSG91_FLOW_VENDOR_JOB_ASSIGNED` | orderRef, scheduledAt, address |
| `BOOKING_REMINDER` | `MSG91_FLOW_BOOKING_REMINDER` | orderRef, scheduledAt, trackUrl |
| `PAYOUT_PAID` | `MSG91_FLOW_PAYOUT_PAID` | amountFormatted, payoutDestination |
| `PAYOUT_FAILED` | `MSG91_FLOW_PAYOUT_FAILED` | amountFormatted, failureReason |

Variable names in the Flow dashboard must match **`VAR1`…`VARn`** in the same order as this table (align with [`msg91.flow-map.ts`](../src/infrastructure/sms/msg91.flow-map.ts)).

---

## Meta template categories

| Category | Use in Decory |
|----------|----------------|
| **Authentication** | `LOGIN_OTP` only |
| **Utility** | Booking, vendor job, payout transactional |
| **Marketing** | Not used — do not send OTP/booking as Marketing |

Guidelines: [Meta template guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines/)

---

## Architecture

```text
notify() → outbox → relay → notify.whatsapp queue → Msg91WhatsAppProvider → sendMsg91Flow → MSG91 /api/v5/flow/
```

Catalog API: `GET /api/v1/admin/settings/message-service/catalog`  
Source: [`message-service-catalog.ts`](../src/modules/ops/settings/message-service-catalog.ts)

---

## Phone login policy

`assertCanSend(LOGIN_OTP)` requires **at least one** of admin **SMS** or **WhatsApp** enabled. With SMS off and WhatsApp on, OTP goes through Flow only.

Re-seed templates after deploy if WhatsApp channel rows are missing: `pnpm db:seed:templates`.

---

## Test

1. `WHATSAPP_PROVIDER=msg91`, flow ID for `LOGIN_OTP`, whatsapp on / sms off, worker running.
2. Request OTP → MSG91 delivery report.
3. Trigger booking with customer phone → Utility template on WhatsApp.
