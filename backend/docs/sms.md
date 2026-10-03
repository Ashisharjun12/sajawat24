# SMS — MSG91, DLT (India), and Decory templates

Decory sends SMS from the **worker** (`sms` BullMQ queue), not the API process. Production India requires **DLT-approved templates** via **MSG91**.

See also: [notifications.md](./notifications.md), [message-service.md](./message-service.md), [DEPLOY.md](../DEPLOY.md), [identity.md](./identity.md).

---

## Part A — Links

| Step | URL |
|------|-----|
| MSG91 signup | https://msg91.com |
| MSG91 control panel | https://control.msg91.com |
| API docs | https://docs.msg91.com |
| Send SMS (v5) reference | https://docs.msg91.com/reference/send-sms |
| SMS pricing (India) | https://msg91.com/in/sms-pricing |
| MSG91 help / DLT | https://help.msg91.com (search “DLT registration”, “DLT template”) |
| Jio DLT (reference) | https://trueconnect.jio.com |
| VIL DLT (reference) | https://www.vilpower.in |

**Billing:** prepaid wallet on MSG91; cost per SMS depends on route and length — confirm live pricing before budgeting (~₹0.15–0.30/SMS is a rough planning range only).

---

## Part B — DLT registration (step by step)

1. **MSG91 account** — sign up, complete **KYC** (business / proprietor as allowed).
2. **DLT Entity (PE)** — register brand **Decorbuddys** (legal entity docs). Note your **Entity ID** (`MSG91_DLT_ENTITY_ID` in `.env` if required by your MSG91 send API).
3. **Sender ID** — register a **6-character** header (India rule). Examples: `DRBUDY`, `DECOBY`, `DBUDYS`. This is **not** the full word “Decorbuddys”; put the brand name **inside** template body text.
4. **Content templates** — for each row in [Part C](#part-c-dlt-content-to-register), submit on DLT as **Transactional** / service-appropriate category. Use variable placeholders exactly as your DLT operator UI requires (often `{#otp#}`, `{#var#}` — match MSG91’s form).
5. **Wait for approval** — often **1–7+ days** per template; start before launch.
6. **MSG91** — link approved DLT templates; copy each **Template ID** into `backend/.env` (see [Part D](#part-d-env-mapping)).
7. **Deploy** — `SMS_PROVIDER=msg91`, fill `MSG91_*`, run **API + worker** (PM2), ensure admin **sms** channel is enabled (`notify.channels`).
8. **Test** — [Part G](#part-g-test-procedure).

**Important:** Edits to SMS text in the admin template UI **must match DLT** or sends fail. Any wording change needs a **new DLT template** and new Template ID in `.env`.

---

## Part C — DLT content to register

App code uses `Decoryy` in seeds; you may register **Decorbuddys** instead if you update DB templates to match after approval.

Use DLT placeholder syntax from your portal when submitting; below shows **semantic** variables.

### Phase 1 — OTP (required for phone login)

| Use | Template body (match app) | Variables |
|-----|---------------------------|-----------|
| Standard OTP | `Your Decoryy code is {#otp#}. Valid for 5 minutes.` | otp |
| Android autofill (vendor app) | `<#> Your Decoryy code is {#otp#}` then newline then `{#hash#}` | otp, hash |

Standard OTP is built in [`formatLoginOtpSms`](../src/modules/notifications/lib/render.ts). Android variant is used when the client sends `androidAppHash` on OTP request.

Env: `MSG91_TEMPLATE_LOGIN_OTP`, optional `MSG91_TEMPLATE_LOGIN_OTP_ANDROID`.

### Phase 2 — Transactional (from notification seeds)

| Template key | SMS body |
|--------------|----------|
| `booking_confirmed` | `Decoryy: Hi {#customerName#}, booking {#orderRef#} confirmed for {#scheduledAt#}. Track: {#trackUrl#}` |
| `booking_assigned` | `Decoryy: Vendor {#vendorName#} assigned to {#orderRef#} on {#scheduledAt#}. Track: {#trackUrl#}` |
| `vendor_en_route` | `Decoryy: {#vendorName#} is on the way for {#orderRef#}. Track: {#trackUrl#}` |
| `vendor_on_site` | `Decoryy: {#vendorName#} has arrived for {#orderRef#}. Setup will begin shortly.` |
| `delivery_code` | `Decoryy: Your completion code for {#orderRef#} is {#code#}. Share with your decorator when setup is done.` |
| `booking_completed` | `Decoryy: Booking {#orderRef#} is complete. Thank you!` |
| `vendor_new_job` | `Decoryy: New job {#orderRef#} on {#scheduledAt#} at {#address#}. Open vendor app.` |
| `vendor_job_assigned` | `Decoryy: You were assigned job {#orderRef#} on {#scheduledAt#} at {#address#}. Open partner app.` |
| `booking_reminder` | `Decoryy: Reminder — booking {#orderRef#} is scheduled for {#scheduledAt#}. Track: {#trackUrl#}` |
| `payout_paid` | `Decoryy: Your payout of {#amountFormatted#} was sent to {#payoutDestination#}. Open the vendor app for details.` |
| `payout_failed` | `Decoryy: Payout of {#amountFormatted#} failed. {#failureReason#} Amount returned to your wallet.` |

`trackUrl` is built from `WEB_APP_ORIGIN` + `/account/bookings/{orderId}` — set production `WEB_APP_ORIGIN=https://decorbuddys.com`.

---

## Part D — Env mapping

```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=
MSG91_SENDER_ID=DRBUDY
MSG91_ROUTE=4
MSG91_DLT_ENTITY_ID=

MSG91_TEMPLATE_LOGIN_OTP=
MSG91_TEMPLATE_LOGIN_OTP_ANDROID=

MSG91_TEMPLATE_BOOKING_CONFIRMED=
MSG91_TEMPLATE_BOOKING_ASSIGNED=
MSG91_TEMPLATE_VENDOR_EN_ROUTE=
MSG91_TEMPLATE_VENDOR_ON_SITE=
MSG91_TEMPLATE_DELIVERY_CODE=
MSG91_TEMPLATE_BOOKING_COMPLETED=
MSG91_TEMPLATE_VENDOR_NEW_JOB=
MSG91_TEMPLATE_VENDOR_JOB_ASSIGNED=
MSG91_TEMPLATE_BOOKING_REMINDER=
MSG91_TEMPLATE_PAYOUT_PAID=
MSG91_TEMPLATE_PAYOUT_FAILED=
```

| Notification event | Env var | Variable order sent to MSG91 (`var1`, `var2`, …) |
|--------------------|---------|--------------------------------------------------|
| `LOGIN_OTP` | `MSG91_TEMPLATE_LOGIN_OTP` or `_ANDROID` | otp — or otp, hash |
| `BOOKING_CONFIRMED` | `MSG91_TEMPLATE_BOOKING_CONFIRMED` | customerName, orderRef, scheduledAt, trackUrl |
| `BOOKING_ASSIGNED` | `MSG91_TEMPLATE_BOOKING_ASSIGNED` | vendorName, orderRef, scheduledAt, trackUrl |
| `VENDOR_EN_ROUTE` | `MSG91_TEMPLATE_VENDOR_EN_ROUTE` | vendorName, orderRef, trackUrl |
| `VENDOR_ON_SITE` | `MSG91_TEMPLATE_VENDOR_ON_SITE` | vendorName, orderRef |
| `DELIVERY_CODE` | `MSG91_TEMPLATE_DELIVERY_CODE` | orderRef, code |
| `BOOKING_COMPLETED` | `MSG91_TEMPLATE_BOOKING_COMPLETED` | orderRef |
| `VENDOR_NEW_JOB` | `MSG91_TEMPLATE_VENDOR_NEW_JOB` | orderRef, scheduledAt, address |
| `VENDOR_JOB_ASSIGNED` | `MSG91_TEMPLATE_VENDOR_JOB_ASSIGNED` | orderRef, scheduledAt, address |
| `BOOKING_REMINDER` | `MSG91_TEMPLATE_BOOKING_REMINDER` | orderRef, scheduledAt, trackUrl |
| `PAYOUT_PAID` | `MSG91_TEMPLATE_PAYOUT_PAID` | amountFormatted, payoutDestination |
| `PAYOUT_FAILED` | `MSG91_TEMPLATE_PAYOUT_FAILED` | amountFormatted, failureReason |

MSG91 maps `var1`…`varN` to the **order of variables in your DLT template** — keep DLT order aligned with this table.

**Local dev:** `SMS_PROVIDER=dev` logs SMS; does not call MSG91.

---

## Part E — Production deploy

- Worker **must** run (`decory-worker` in PM2). See [DEPLOY.md](../DEPLOY.md).
- Never use `SMS_PROVIDER=dev` in production if users need OTP.
- `ANDROID_OTP_APP_HASH` — vendor Android SMS autofill (see `.env.sample`).
- Long `trackUrl` values may use **multiple SMS segments** (higher cost).

---

## Part F — Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| API 503 on OTP | SMS and WhatsApp channels both disabled in admin settings |
| OTP never arrives | Worker not running; wrong `SMS_PROVIDER`; MSG91 wallet empty |
| MSG91 / DLT error | Template text mismatch; wrong Template ID; sender not linked to entity |
| CORS OK but no SMS | Expected — SMS is async via worker |
| Wrong track link | `WEB_APP_ORIGIN` not set to production web URL |

Check worker logs and MSG91 dashboard delivery reports.

---

## Part G — Test procedure

1. `.env`: `SMS_PROVIDER=msg91`, all keys filled, at least `MSG91_TEMPLATE_LOGIN_OTP` approved.
2. Start API + worker; confirm Redis and Supabase up.
3. Request OTP from vendor or web login with a real **+91** test number.
4. Confirm MSG91 dashboard shows **delivered**; verify SMS text matches DLT template.
5. Optional: trigger booking confirmed SMS (test booking) after Phase 2 template IDs are set.
6. Roll back to `SMS_PROVIDER=dev` on laptop only — never on production VPS.

---

## Architecture

```text
notify() → outbox → relay → sms queue → Msg91SmsProvider → MSG91 v5 /api/v5/sms/send
```

Provider: [`msg91.provider.ts`](../src/infrastructure/sms/provider/msg91.provider.ts)  
Template routing: [`msg91.template-map.ts`](../src/infrastructure/sms/msg91.template-map.ts)

---

## Part H — MSG91 One API Flow (WhatsApp)

WhatsApp transactional messages use **Flow IDs**, not DLT template IDs. Full setup: **[message-service.md](./message-service.md)**.

- Endpoint: `POST https://api.msg91.com/api/v5/flow/` (override with `MSG91_FLOW_API_URL`)
- Env: `MSG91_FLOW_*` per event; worker queue `notify.whatsapp`
- Phase 1: WhatsApp on, SMS off; Phase 2: add `MSG91_TEMPLATE_*` and enable SMS channel (v5 send) or add SMS steps to each Flow

Flow client: [`msg91.flow.provider.ts`](../src/infrastructure/sms/provider/msg91.flow.provider.ts)  
Flow routing: [`msg91.flow-map.ts`](../src/infrastructure/sms/msg91.flow-map.ts)
