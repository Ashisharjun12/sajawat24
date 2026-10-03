# Geo module

City + pincode **allowlist**. Product context: [`docs/project-requriment.md`](../../docs/project-requriment.md). Catalog, maps, and vendor `city` FK are not this module.

Unknown PIN is **not serviceable**. There are no numeric PIN ranges (`302001–302041`). Admin adds one row per PIN we actually serve.

## Runtime

Same API process as identity. After schema changes, from `backend/`: `pnpm db:generate` then `pnpm db:migrate`.

Base: `http://localhost:3000/api/v1`.

## Tables

| Table | Role |
|---|---|
| `cities` | `name`, `slug`, `state`, `isActive` |
| `pincodes` | unique 6-digit `code`, `cityId`, `isServiceable`, optional `locality` |

A PIN is live only if the row exists, `isServiceable` is true, **and** the city `isActive`.

## Public (no auth)

| Method | Path | What |
|---|---|---|
| GET | `/geo/cities` | Active cities (`id`, `name`, `slug`, `state`) |
| GET | `/geo/resolve?pincode=302001` | City + pincode if serviceable |

Invalid PIN → 400 `invalid pincode`. Missing / inactive / unserviceable → 400 `pincode not serviceable`.

## Admin (Bearer + role `admin`)

Mount: `/api/v1/admin`. Login: `POST /auth/admin/login`.

| Method | Path | What |
|---|---|---|
| GET | `/admin/cities?page=&limit=&q=&isActive=` | All cities; `q` matches name/slug; `isActive` is `true`/`false` or omit for all |
| POST | `/admin/cities` | Create (`name`, `state`, optional `slug`, `isActive`) |
| PATCH | `/admin/cities/:id` | Update; set `isActive: false` to hide (no hard delete) |
| GET | `/admin/pincodes?cityId=&page=&limit=&q=&isServiceable=` | Allowlist; `q` is PIN prefix; `isServiceable` is `true`/`false` or omit for all |
| POST | `/admin/pincodes` | Add PIN (`code`, `cityId`, optional `locality`, `isServiceable`) |
| PATCH | `/admin/pincodes/:id` | Turn off a PIN with `isServiceable: false` |

## Internal (catalog / booking later)

Import `@/modules/geo`:

- `assertServiceable(pincode)` — same rules as resolve; throws `ApiError`
- `getCityByPincode(pincode)` — `{ id, name, slug, state }`
- `assertDeliveryLocation({ cityId, pincode })` — used by customer cart, orders, and saved addresses (pin must match allowlist rules for that city)

**Vendor onboarding** (`POST` vendor register / reapply): validates **active `cityId`** (via `getActiveCityById`) and **6-digit pin format** in the DTO only. It does **not** call `assertDeliveryLocation`; shop pincode from the map is stored for ops and is not gated on the pincode allowlist or pin–city table match.

---

## Postman catalog

Set collection variable `baseUrl` = `http://localhost:3000/api/v1`.

Geo HTTP does **not** use `clientType`. **Web and mobile send the same public requests.** Admin routes are for the admin dashboard (or Postman); the vendor Expo app does not call them.

Admin: header `Authorization: Bearer {{accessToken}}` from `POST /auth/admin/login` ([identity.md](./identity.md)). Role must be `admin`.

Example IDs used below: city `a1b2c3d4-e5f6-7890-abcd-ef1234567890`, pincode `b2c3d4e5-f6a7-8901-bcde-f12345678901`. Substitute real UUIDs from create responses.

Success envelope (`statusCode < 400`):

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "ok"
}
```

Error:

```json
{
  "success": false,
  "message": "pincode not serviceable",
  "errors": []
}
```

---

### `GET /geo/cities`

Lists **active** cities for the customer city picker (homepage / “we serve”). Inactive cities are omitted. Empty `[]` until admin creates a live city.

**Auth:** none. Same for web and mobile.

**URL:** `{{baseUrl}}/geo/cities`

**Body:** none.

**Success 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Jaipur",
      "slug": "jaipur",
      "state": "Rajasthan"
    }
  ],
  "message": "ok"
}
```

Empty (no live cities yet):

```json
{
  "success": true,
  "statusCode": 200,
  "data": [],
  "message": "ok"
}
```

---

### `GET /geo/resolve`

Allowlist lookup: is this India PIN live? Hyphens/spaces are stripped (`302-001` → `302001`). Succeeds only if the PIN row exists, `isServiceable` is true, **and** the city `isActive`.

Used by customer web/mobile before showing catalog (catalog will call the same rule later via `assertServiceable`).

**Auth:** none. Same for web and mobile.

**URL:** `{{baseUrl}}/geo/resolve?pincode=302001`

Query `pincode` is required (min length 1 at Zod; format checked in service).

**Body:** none.

**Success 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "pincode": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "code": "302001",
      "locality": null,
      "isServiceable": true
    },
    "city": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Jaipur",
      "slug": "jaipur",
      "state": "Rajasthan"
    }
  },
  "message": "ok"
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` (missing `pincode` query) |
| 400 | `invalid pincode` (not 6 digits starting 1–9) |
| 400 | `pincode not serviceable` (unknown, `isServiceable: false`, or city inactive) |

---

### `GET /admin/cities`

Lists **all** cities for admin, including inactive. Paginated.

**Auth:** Bearer admin.

**URL:** `{{baseUrl}}/admin/cities?page=1&limit=20`

`page` default 1, `limit` default 20 (max 100). Query params are optional.

- `q` — case-insensitive match on `name` and `slug` (omit or empty = no text filter)
- `isActive` — `true` or `false`; omit = all cities

Filtered example (Postman): `{{baseUrl}}/admin/cities?q=jai&isActive=true&page=1&limit=20`

**Body:** none.

**Success 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Jaipur",
        "slug": "jaipur",
        "state": "Rajasthan",
        "isActive": true,
        "createdAt": "2026-08-19T18:30:00.000Z",
        "updatedAt": "2026-08-19T18:30:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "message": "ok"
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` (`isActive` not `true` or `false`) |
| 401 | `missing authorization header` / `invalid or expired access token` / `user not found` |
| 403 | `account blocked` / `insufficient role` |

---

### `POST /admin/cities`

Creates a city. `slug` is generated from `name` if omitted (`Jaipur` → `jaipur`). `isActive` defaults to `true`. No hard delete later — use PATCH `isActive: false`.

**Auth:** Bearer admin.

**URL:** `{{baseUrl}}/admin/cities`

**Headers:** `Content-Type: application/json`

**Body (required fields only):**

```json
{
  "name": "Jaipur",
  "state": "Rajasthan"
}
```

**Body (all fields):**

```json
{
  "name": "Jaipur",
  "state": "Rajasthan",
  "slug": "jaipur",
  "isActive": true
}
```

Same body for Postman whether you think of it as web or mobile; this route is admin-only.

**Success 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Jaipur",
    "slug": "jaipur",
    "state": "Rajasthan",
    "isActive": true,
    "createdAt": "2026-08-19T18:30:00.000Z",
    "updatedAt": "2026-08-19T18:30:00.000Z"
  },
  "message": "city created"
}
```

Save `data.id` as `cityId`.

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` (`name`/`state` min 2) |
| 400 | `invalid city slug` |
| 409 | `city name or slug already exists` |
| 401 / 403 | same as list admin cities |

---

### `PATCH /admin/cities/:id`

Updates a city. All body fields optional. Sending `name` without `slug` also regenerates `slug` from the new name. `isActive: false` hides the city from `GET /geo/cities` and makes all its PINs fail resolve.

**Auth:** Bearer admin.

**URL:** `{{baseUrl}}/admin/cities/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Headers:** `Content-Type: application/json`

**Deactivate:**

```json
{
  "isActive": false
}
```

**Rename / state:**

```json
{
  "name": "Jaipur",
  "state": "Rajasthan",
  "slug": "jaipur"
}
```

**Success 200:** same city object shape as create. Message `"city updated"`.

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` (invalid UUID in path) |
| 400 | `invalid city slug` |
| 404 | `city not found` |
| 409 | `city name or slug already exists` |
| 401 / 403 | same as list |

---

### `GET /admin/pincodes`

Lists allowlist rows (all PINs, including `isServiceable: false`). Paginated.

**Auth:** Bearer admin.

**URL:** `{{baseUrl}}/admin/pincodes?page=1&limit=20`

- `cityId` — UUID; omit = all cities
- `q` — digits-only prefix on `code` (`302` matches `302001`); non-digits are stripped
- `isServiceable` — `true` or `false`; omit = all PINs

Filter one city: `{{baseUrl}}/admin/pincodes?cityId=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Filtered example (Postman): `{{baseUrl}}/admin/pincodes?q=302&isServiceable=true&page=1&limit=20`

**Body:** none.

**Success 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "code": "302001",
        "cityId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "isServiceable": true,
        "locality": null,
        "createdAt": "2026-08-19T18:30:00.000Z",
        "updatedAt": "2026-08-19T18:30:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "message": "ok"
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` (`cityId` not a UUID, or `isServiceable` not `true`/`false`) |
| 401 / 403 | same as list admin cities |

---

### `POST /admin/pincodes`

Adds one PIN to the allowlist. `code` is normalized (digits only, must be 6 digits starting 1–9). `isServiceable` defaults to `true`. `locality` is optional.

**Auth:** Bearer admin.

**URL:** `{{baseUrl}}/admin/pincodes`

**Headers:** `Content-Type: application/json`

**Body (required):**

```json
{
  "code": "302001",
  "cityId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Body (all fields):**

```json
{
  "code": "302001",
  "cityId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "locality": "MI Road",
  "isServiceable": true
}
```

**Success 200:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "code": "302001",
    "cityId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "isServiceable": true,
    "locality": "MI Road",
    "createdAt": "2026-08-19T18:30:00.000Z",
    "updatedAt": "2026-08-19T18:30:00.000Z"
  },
  "message": "pincode created"
}
```

Save `data.id` as `pincodeId`. Then `GET /geo/resolve?pincode=302001`.

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` |
| 400 | `invalid pincode` |
| 404 | `city not found` |
| 409 | `pincode already exists` |
| 401 / 403 | same as list |

---

### `PATCH /admin/pincodes/:id`

Updates a PIN. All fields optional. Set `isServiceable: false` to drop it from public resolve without deleting the row. You can move a PIN to another city with `cityId`.

**Auth:** Bearer admin.

**URL:** `{{baseUrl}}/admin/pincodes/b2c3d4e5-f6a7-8901-bcde-f12345678901`

**Headers:** `Content-Type: application/json`

**Turn off:**

```json
{
  "isServiceable": false
}
```

**Locality / city:**

```json
{
  "locality": "C-Scheme",
  "cityId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Success 200:** same pincode object shape as create. Message `"pincode updated"`.

After `isServiceable: false`, `GET /geo/resolve?pincode=302001` returns 400 `pincode not serviceable`.

**Errors**

| Status | Message |
|---|---|
| 400 | `validation failed` |
| 404 | `pincode not found` / `city not found` (if `cityId` set) |
| 401 / 403 | same as list |

---

## Postman checklist

1. From `backend/`: `pnpm db:generate` then `pnpm db:migrate` (cities + pincodes tables).
2. `pnpm dev`. Admin login → save `accessToken`.
3. `POST /admin/cities` with Jaipur → save `cityId`.
4. `POST /admin/pincodes` with `302001` and that `cityId` → save `pincodeId`.
5. `GET /geo/cities` (no auth) → Jaipur in the array.
6. `GET /geo/resolve?pincode=302001` (no auth) → city + pincode.
7. `GET /geo/resolve?pincode=000000` → 400 `invalid pincode`.
8. `GET /geo/resolve?pincode=399999` → 400 `pincode not serviceable`.
9. `PATCH /admin/pincodes/:id` `{ "isServiceable": false }` → resolve `302001` is 400.
10. `PATCH` that PIN back to `true`, then `PATCH` city `{ "isActive": false }` → public cities omit it and resolve still 400.

