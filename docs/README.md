# Decory API (Postman)

HTTP contracts for **live** mounted routes only. Booking, payments, CMS, assignment, and fulfillment are not documented here — they are not mounted.

| File | What |
|---|---|
| [auth.md](auth.md) | `/api/v1/auth`, `/user`, `/vendor` — web vs mobile tokens |
| [geo.md](geo.md) | Public cities/pincode resolve + admin cities/pincodes |
| [catalog.md](catalog.md) | Catalog overview + public catalog |
| [category.md](category.md) | Categories |
| [products.md](products.md) | Products, city prices, add-on map |
| [addons.md](addons.md) | Add-ons, colors, city prices |
| [sections.md](sections.md) | Sections (global + city override) |
| [media.md](media.md) | Uploads + media folders |
| [admin.md](admin.md) | `/api/v1/admin` gateway index |
| [notifications.md](notifications.md) | Channel flags, templates, prefs, `notify()`, BullMQ |

## Base URL

```text
http://localhost:3000
```

API prefix: `/api/v1`. Health (no prefix): `GET /health`.

Port comes from `PORT` in env; default is `3000`.

CORS origins: `http://localhost:5173` (admin) and `http://localhost:5174` (web) with `credentials: true`. Send cookies on auth refresh/logout for **web**.

## Postman setup

1. Collection variables: `baseUrl` = `http://localhost:3000/api/v1`, `accessToken` = empty.
2. After login, copy `data.accessToken` into `accessToken`.
3. Admin requests: header `Authorization: Bearer {{accessToken}}`.
4. Enable cookie jar. Web login always sets httpOnly cookie `refreshToken`.
5. Mobile: also copy `data.refreshToken` and send it in the JSON body on refresh/logout (`clientType: "mobile"`).

**Admin smoke path:** `POST /auth/admin/login` → `GET /admin/cities`.

**Customer smoke path:** `GET /geo/resolve?pincode=...` → `GET /catalog/sections?pincode=...` → `GET /catalog/products?pincode=...` → `GET /catalog/products/:id?pincode=...`.

## Envelope

Success (`ApiResponse`):

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "ok"
}
```

`POST /admin/uploads/:id/optimize` uses `statusCode: 202`.

Error:

```json
{
  "success": false,
  "message": "pincode not serviceable",
  "errors": []
}
```

Validation failures use the same error envelope (`message` + `errors` from Zod).

## Auth

| Client | Access | Refresh |
|---|---|---|
| Web (`clientType: "web"`) | JSON `accessToken` | Cookie `refreshToken` only |
| Mobile (`clientType: "mobile"`) | JSON `accessToken` | Cookie **and** JSON `refreshToken` |

Protected routes: `Authorization: Bearer <accessToken>`.

Admin gateway (`/api/v1/admin/*`): Bearer **and** `role: admin`. Otherwise `401` missing/invalid token or `403` `insufficient role` / `account blocked`.

## Pagination (admin lists)

Query `page` (default `1`) and `limit` (default `20`, max `100`). Strings are accepted.

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

## Money

Integer **paise** only. Never `0`. `null` = free / no default price. `compareAtPaise` must be `>= pricePaise` when both are set.

## Web vs mobile payloads

Auth bodies differ (`clientType`, optional `device`, refresh in body vs cookie). Catalog, geo, and admin JSON are the same for every client. Each endpoint still lists **Clients**.

## Health

`GET /health`

```json
{ "message": "Decoryy is Live" }
```

Not wrapped in `ApiResponse`.
