# Admin gateway

Admin is a **surface**, not a domain. It has no tables. [`backend/src/modules/admin/admin.route.ts`](../backend/src/modules/admin/admin.route.ts) mounts geo, upload, catalog, booking, identity, and ops settings admin routers.

**Base:** `http://localhost:3000/api/v1/admin`

**Auth:** `Authorization: Bearer {{accessToken}}` **and** user `role` must be `admin`.

Every route below uses that middleware. Payloads live in the linked files.

## Postman

1. `POST {{baseUrl}}/auth/admin/login` with web payload (see [auth.md](auth.md)).
2. Save `data.accessToken` as `{{accessToken}}`.
3. Collection header: `Authorization: Bearer {{accessToken}}`.
4. `clientType` defaults to `"web"` on admin login. Cookie `refreshToken` is set; you do not need it on `/admin/*` (those use the access token only).

Errors: `401` `missing authorization header` / `user not found`; `403` `account blocked` / `insufficient role`.

## Index

### Geo — [geo.md](geo.md)

| Method | Path |
|---|---|
| GET | `/api/v1/admin/cities` |
| POST | `/api/v1/admin/cities` |
| PATCH | `/api/v1/admin/cities/:id` |
| GET | `/api/v1/admin/pincodes` |
| POST | `/api/v1/admin/pincodes` |
| PATCH | `/api/v1/admin/pincodes/:id` |

### Media — [media.md](media.md)

| Method | Path |
|---|---|
| GET | `/api/v1/admin/uploads` |
| POST | `/api/v1/admin/uploads/presign` |
| POST | `/api/v1/admin/uploads/ingest` |
| POST | `/api/v1/admin/uploads/:id/complete` |
| POST | `/api/v1/admin/uploads/:id/optimize` |
| GET | `/api/v1/admin/uploads/:id` |
| PATCH | `/api/v1/admin/uploads/:id` |
| DELETE | `/api/v1/admin/uploads/:id` |
| GET | `/api/v1/admin/media-folders` |
| POST | `/api/v1/admin/media-folders` |
| PATCH | `/api/v1/admin/media-folders/:id` |
| DELETE | `/api/v1/admin/media-folders/:id` |

### Catalog — [category.md](category.md), [products.md](products.md), [addons.md](addons.md), [sections.md](sections.md)

| Method | Path |
|---|---|
| GET | `/api/v1/admin/categories` |
| POST | `/api/v1/admin/categories` |
| PATCH | `/api/v1/admin/categories/:id` |
| GET | `/api/v1/admin/products` |
| POST | `/api/v1/admin/products` |
| GET | `/api/v1/admin/products/:id` |
| PATCH | `/api/v1/admin/products/:id` |
| DELETE | `/api/v1/admin/products/:id` |
| GET | `/api/v1/admin/products/:id/city-prices` |
| PUT | `/api/v1/admin/products/:id/city-prices` |
| DELETE | `/api/v1/admin/products/:id/city-prices/:cityId` |
| POST | `/api/v1/admin/products/:id/addons` |
| DELETE | `/api/v1/admin/products/:id/addons/:addonId` |
| GET | `/api/v1/admin/addons` |
| POST | `/api/v1/admin/addons` |
| GET | `/api/v1/admin/addons/colors` |
| POST | `/api/v1/admin/addons/colors` |
| PATCH | `/api/v1/admin/addons/colors/:id` |
| GET | `/api/v1/admin/addons/:id/city-prices` |
| PUT | `/api/v1/admin/addons/:id/city-prices` |
| DELETE | `/api/v1/admin/addons/:id/city-prices/:cityId` |
| GET | `/api/v1/admin/addons/:id` |
| PATCH | `/api/v1/admin/addons/:id` |
| GET | `/api/v1/admin/sections` |
| POST | `/api/v1/admin/sections` |
| PATCH | `/api/v1/admin/sections/:id` |
| DELETE | `/api/v1/admin/sections/:id` |
| GET | `/api/v1/admin/sections/:id/products` |
| PUT | `/api/v1/admin/sections/:id/products` |
| DELETE | `/api/v1/admin/sections/:id/city-overrides/:cityId` |

### Settings — [notifications.md](notifications.md)

| Method | Path |
|---|---|
| GET | `/api/v1/admin/settings/notifications` |
| PATCH | `/api/v1/admin/settings/notifications` |
| GET | `/api/v1/admin/notification-templates` |
| PATCH | `/api/v1/admin/notification-templates/:id` |
| POST | `/api/v1/admin/notification-templates/:id/versions` |

Register `/colors` **before** `/:id` in Postman so `GET /addons/colors` is not parsed as an addon id. Register `/sections/:id/products` and `/city-overrides` before treating the rest as a bare section id.


## Envelope

Same as [README.md](README.md). All admin handlers return `200` except optimize (`202`).
