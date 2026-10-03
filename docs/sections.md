# Sections

**Module:** `backend/src/modules/catalog/sections`  
**Public:** `/api/v1/catalog/sections`  
**Admin:** `/api/v1/admin/sections`

Envelope: [README.md](README.md). Overview: [catalog.md](catalog.md). Admin auth: [admin.md](admin.md).

Named **sections** (Trending, Popular, …). Not categories. A section has a **global** product list. A city may **replace** that list (not merge). Public home: pincode → city → city list if an override exists, else global → keep only products priced for that city.

**Clients:** public → customer web/mobile; admin → admin web.

## Rules

- `cityId` null on membership = global list.
- Presence of `catalog_section_city_overrides` for `(section, city)` = custom list for that city (may be empty → section hidden there).
- Absence of override = inherit global.
- Max **24** products per list. `productIds` must be unique.
- Inactive section is omitted from the public response.
- Inactive or unpriced products are omitted from public `items`. Empty sections after that filter are omitted.
- No seed sections. Admin creates them.

## Shape (`CatalogSection`)

```json
{
  "id": "55555555-5555-4555-8555-555555555555",
  "name": "Trending",
  "slug": "trending",
  "sortIndex": 0,
  "isActive": true,
  "createdAt": "2026-08-22T05:00:00.000Z",
  "updatedAt": "2026-08-22T05:00:00.000Z"
}
```

---

## GET `/api/v1/catalog/sections`

**Auth:** public  
**Clients:** customer web/mobile

### Query

| Field | Required | Notes |
|---|---|---|
| `pincode` | yes | min 6 |

`GET /api/v1/catalog/sections?pincode=302001`

### Payload

None.

### Response `data`

```json
{
  "city": {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "name": "Jaipur",
    "slug": "jaipur",
    "state": "Rajasthan"
  },
  "sections": [
    {
      "id": "55555555-5555-4555-8555-555555555555",
      "name": "Trending",
      "slug": "trending",
      "sortIndex": 0,
      "isActive": true,
      "createdAt": "2026-08-22T05:00:00.000Z",
      "updatedAt": "2026-08-22T05:00:00.000Z",
      "source": "city",
      "items": []
    }
  ]
}
```

`source` is `"city"` when this city has an override, otherwise `"global"`. Each `items[]` entry is the same city product as [GET `/catalog/products`](products.md) (`pricePaise`, `images` with display `url`, `addonIds`). Message `"ok"`.

### Errors

- `400` `pincode not serviceable` / invalid pincode

---

## GET `/api/v1/admin/sections`

**Auth:** Bearer + admin

No pagination. Ordered by `sortIndex`, then name.

### Payload

None.

### Response `data`

```json
{
  "items": []
}
```

Each item is `CatalogSection`. Message `"ok"`.

---

## POST `/api/v1/admin/sections`

**Auth:** Bearer + admin

### Payload

```json
{
  "name": "Trending",
  "slug": "trending",
  "sortIndex": 0,
  "isActive": true
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | min 2 |
| `slug` | no | min 2; slugified from name if omitted |
| `sortIndex` | no | int, default `0` |
| `isActive` | no | default `true` |

### Response `data`

`CatalogSection`. Message `"section created"`.

### Errors

- `400` `invalid section slug`
- `409` slug already exists

---

## PATCH `/api/v1/admin/sections/:id`

**Auth:** Bearer + admin

### Params

`id` uuid.

### Payload

All optional:

```json
{
  "name": "Trending now",
  "slug": "trending-now",
  "sortIndex": 1,
  "isActive": false
}
```

If `name` is sent without `slug`, slug is regenerated from the new name.

### Response `data`

`CatalogSection`. Message `"section updated"`.

### Errors

- `404` `section not found`
- `409` slug conflict

---

## DELETE `/api/v1/admin/sections/:id`

**Auth:** Bearer + admin

### Params

`id` uuid.

### Response `data`

```json
{ "id": "55555555-5555-4555-8555-555555555555" }
```

Message `"section deleted"`. Memberships and city overrides cascade.

### Errors

- `404` `section not found`

---

## GET `/api/v1/admin/sections/:id/products`

**Auth:** Bearer + admin

### Query

| Field | Required | Notes |
|---|---|---|
| `cityId` | no | uuid. Omit = global list |

### Response `data`

```json
{
  "source": "global",
  "items": [
    {
      "productId": "33333333-3333-4333-8333-333333333333",
      "sortIndex": 0,
      "product": {}
    }
  ]
}
```

`source` is `"city"` only when `cityId` is set **and** that city has an override. Otherwise `"global"` and the global membership is returned (even if you passed `cityId`). `product` is the admin product (images, `addonIds`). Inactive products are included. Message `"ok"`.

### Errors

- `404` `section not found` / `city not found`

---

## PUT `/api/v1/admin/sections/:id/products`

**Auth:** Bearer + admin

Replaces the whole list for that scope.

### Payload

```json
{
  "cityId": null,
  "productIds": ["33333333-3333-4333-8333-333333333333"]
}
```

| Field | Required | Notes |
|---|---|---|
| `cityId` | yes | uuid or `null` (`null` = global) |
| `productIds` | yes | uuid[], max 24, unique. Empty allowed |

`cityId` set: upserts the city override, then replaces that city’s rows. Empty array = hide the section in that city.

### Response `data`

Same as GET products (`source` + `items`). Message `"products saved"`.

### Errors

- `404` `section not found` / `city not found`
- `400` `product not found` / duplicate or too many `productIds`

---

## DELETE `/api/v1/admin/sections/:id/city-overrides/:cityId`

**Auth:** Bearer + admin

Drops the city override and that city’s membership rows. The city inherits global again.

### Response `data`

Same as GET products for that `cityId` (now `source: "global"`). Message `"city override removed"`.

### Errors

- `404` `section not found` / `city not found` / `city override not found`
