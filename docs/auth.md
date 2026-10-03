# Auth (identity)

**Module:** `backend/src/modules/identity`  
**Mounts:** `/api/v1/auth`, `/api/v1/user`, `/api/v1/vendor`

Envelope: see [README.md](README.md).

## Tokens

Login/refresh **always** sets cookie `refreshToken`:

| Option | Value |
|---|---|
| httpOnly | true |
| sameSite | `lax` |
| secure | production only |
| maxAge | 30 days |
| path | `/` |

JSON `data.refreshToken` is included **only** when `clientType` is `"mobile"`.

Refresh and logout read `cookie.refreshToken` **or** `body.refreshToken` (cookie wins if both exist).

`clientType`: `"web"` | `"mobile"` (required on OTP verify and Google).  
`device`: optional `"web"` | `"ios"` | `"android"`. If `clientType` is `"web"`, device is forced to `"web"`.

### Web login `data`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "phone": "9876543210",
    "email": null,
    "name": "Ashish",
    "avatar": null,
    "role": "user",
    "status": "active"
  }
}
```

Cookie `refreshToken` is set. It is **not** in JSON.

### Mobile login `data`

Same as web **plus** `"refreshToken": "<hex>"`.

Vendor users may also include:

```json
"vendor": {
  "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "city": "Jaipur",
  "onboardingStatus": "pending"
}
```

`role`: `"user"` | `"vendor"` | `"admin"`. `status`: `"active"` | `"blocked"`.

---

## POST `/api/v1/auth/otp/request`

**Auth:** public  
**Clients:** customer web, mobile, vendor (after register)

Sends SMS. Rate limit: 5 per hour per phone + IP. Message: `"otp sent"`.

If a vendor register is pending for that phone, purpose is `vendor_register`; otherwise `login`.

### Web payload

```json
{
  "phone": "9876543210"
}
```

### Mobile payload

Same as web.

### Response `data`

Production:

```json
{ "phone": "9876543210" }
```

Development (`NODE_ENV=development`) also returns `"otp": "123456"` so you can verify in Postman without SMS.

### Demo login (Play Store review)

**Setup (production):**

1. On the API server: `cd backend && npm run db:seed:demo-access` (creates review customer, vendor owner, and staff accounts; idempotent).
2. In admin: **Settings → Demo credentials** — enable master switch and per-app toggles (`platform_settings` key `demo.auth`).

**Default phones** (override with `DEMO_CUSTOMER_PHONE`, `DEMO_VENDOR_OWNER_PHONE`, `DEMO_VENDOR_STAFF_PHONE`, `DEMO_AUTH_OTP` in backend `.env`):

| App | Phone | OTP |
|-----|-------|-----|
| Customer | 9000000001 | 123456 |
| Vendor owner | 9000000002 | 123456 |
| Vendor staff | 9000000003 | 123456 |

When the admin **master switch is on** and the matching per-app toggle is on, `POST /auth/otp/request` skips SMS and stores the fixed OTP in Redis. When demo is **off**, review numbers use the normal SMS OTP path (same as any other phone).

- **Customer app:** phone above, **no** `loginIntent`.
- **Vendor owner:** owner phone, `loginIntent: "owner"`, `partnerSignIn: true` on verify.
- **Vendor staff:** staff phone, `loginIntent: "staff"`, `partnerSignIn: true` on verify.

In **production**, the API does not echo OTP in JSON for demo or SMS logins. In **`NODE_ENV=development`**, OTP is included in the request response when channels are off (no SMS send) or after a normal send — same as before. Paste review credentials in Google Play Console → App content → App access.

### Errors

- `400` invalid phone
- `400` `too many OTP requests, try later`

---

## POST `/api/v1/auth/otp/verify`

**Auth:** public  
**Clients:** customer web, mobile, vendor complete-signup

Creates a user on first login, or finishes vendor register if pending.

### Web payload

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "clientType": "web"
}
```

### Mobile payload

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "clientType": "mobile",
  "device": "android"
}
```

`otp` must be exactly 6 characters. `device` optional (`ios` | `android` | `web`).

### Response

`200`, message `"logged in"`. Cookie set. `data` = web or mobile login shape above.

### Errors

- `401` invalid / expired OTP / too many attempts
- `400` `vendor registration expired, register again`
- `409` `finish vendor signup` / `phone already registered`
- `403` blocked

---

## POST `/api/v1/auth/google`

**Auth:** public  
**Clients:** customer web + mobile (role `user`)

### Web payload

```json
{
  "idToken": "<google-id-token>",
  "clientType": "web"
}
```

### Mobile payload

```json
{
  "idToken": "<google-id-token>",
  "clientType": "mobile",
  "device": "ios"
}
```

`idToken` min length 10.

### Response

Same as OTP verify. Message `"logged in"`.

### Errors

- `500` if `GOOGLE_CLIENT_ID` is missing
- `401` invalid Google token
- `409` `cannot link google to this account`

---

## POST `/api/v1/auth/admin/login`

**Auth:** public (email/password prove admin)  
**Clients:** admin web

### Web payload

```json
{
  "email": "admin@example.com",
  "password": "your-password",
  "clientType": "web"
}
```

`clientType` defaults to `"web"` if omitted. `device` optional.

### Mobile payload

Admin dashboard is web. If you must test from Postman as mobile:

```json
{
  "email": "admin@example.com",
  "password": "your-password",
  "clientType": "mobile",
  "device": "android"
}
```

That puts `refreshToken` in JSON as well as the cookie.

### Response

`200`, message `"logged in"`. `user.role` is `"admin"`. Copy `data.accessToken` for `/admin/*`.

### Errors

- `401` `invalid credentials` (wrong password, non-admin, missing hash)

---

## POST `/api/v1/auth/refresh`

**Auth:** refresh cookie or body (no Bearer required)  
**Clients:** admin web, customer web, mobile

Rotates the session. Message `"token refreshed"`. Default `clientType` is `"web"` if omitted.

### Web payload

Empty body is valid (`{}`) when the cookie is present:

```json
{
  "clientType": "web"
}
```

Postman: enable cookie jar from the login response.

### Mobile payload

```json
{
  "refreshToken": "<hex from last login>",
  "clientType": "mobile",
  "device": "android"
}
```

### Response

Same login `data` as OTP verify (web vs mobile).

### Errors

- `401` `No refresh token`
- `401` invalid / expired / reused refresh (family revoke)

---

## POST `/api/v1/auth/logout`

**Auth:** refresh cookie or body (no Bearer required)  
**Clients:** all

Clears cookie. Message `"logged out"`. `data` is `null`.

### Web payload

Cookie is enough. Optional:

```json
{}
```

### Mobile payload

```json
{
  "refreshToken": "<hex>"
}
```

### Errors

- `401` `No refresh token`

---

## GET `/api/v1/auth/me`

**Auth:** Bearer (any role)  
**Clients:** admin web, any logged-in client

No body.

### Headers

```text
Authorization: Bearer {{accessToken}}
```

### Response `data`

`PublicUser` (same `user` object as login). Message `"ok"`.

Vendor example:

```json
{
  "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "phone": "9876543210",
  "email": null,
  "name": "Decorator",
  "avatar": null,
  "role": "vendor",
  "status": "active",
  "vendor": {
    "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "city": "Jaipur",
    "onboardingStatus": "pending"
  }
}
```

### Errors

- `401` missing/invalid Bearer / `user not found`
- `403` `account blocked`

---

## GET `/api/v1/user/me`

**Auth:** Bearer  
**Clients:** same as `/auth/me`

Duplicate of `GET /api/v1/auth/me` (same handler). Admin currently uses `/auth/me`.

Payload: none. Response: same as `/auth/me`.

---

## POST `/api/v1/vendor/register`

**Auth:** public  
**Clients:** vendor mobile (intended)

Stores pending vendor in Redis and sends OTP. Complete with `POST /auth/otp/verify` using the same phone.

### Web payload

```json
{
  "name": "Ram Decorators",
  "phone": "9876543210",
  "city": "Jaipur"
}
```

### Mobile payload

Same as web. Auth `clientType` is only required on **verify**, not on register.

### Response `data`

Same as OTP request: `{ "phone": "9876543210" }` plus `"otp"` in development. Message `"otp sent"`.

### Errors

- `409` `phone already registered`
- `400` invalid phone / rate limit
