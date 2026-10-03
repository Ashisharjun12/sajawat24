# Add-ons

**Module:** `backend/src/modules/catalog/addons`  
**Admin:** `/api/v1/admin/addons`  
**Public:** none (customers see add-ons only through a product’s `addonIds`)

Envelope: [README.md](README.md). Overview: [catalog.md](catalog.md). Map onto a product: [products.md](products.md). Admin auth: [admin.md](admin.md).

Colors are a shared library. An add-on may have one `colorId` (`null` = none). There is **no DELETE color** route. Hex is `#` plus 6 hex digits, stored lowercase.

**Quirk:** `POST` create and `PATCH` return the **raw** `Addon` row (`imageUploadId` / `colorId` only). List and get return `AddonAdmin` (`image` + `color`). Get also includes `prices`.

**Clients:** admin web. Payloads are the same for web and mobile.

## Addon row (create/patch `data`)

```json
{
  "id": "44444444-4444-4444-8444-444444444444",
  "name": "Extra balloon bunch",
  "slug": "extra-balloon-bunch",
  "description": null,
  "imageUploadId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "colorId": "66666666-6666-4666-8666-666666666666",
  "isActive": true,
  "pricePaise": 19900,
  "compareAtPaise": null,
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z"
}
```

`pricePaise: null` = free.

## AddonAdmin (list / get)

Raw row plus:

```json
{
  "image": {
    "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    "url": "https://cdn.example/uploads/....-opt.webp"
  },
  "color": {
    "id": "66666666-6666-4666-8666-666666666666",
    "name": "Pastel pink",
    "slug": "pastel-pink",
    "hex": "#f4c2c2"
  }
}
```

`image` / `color` may be `null`. `image` is full `PublicMedia` + `url` (see [category.md](category.md) for the full media object).

## AddonColor

```json
{
  "id": "66666666-6666-4666-8666-666666666666",
  "name": "Pastel pink",
  "slug": "pastel-pink",
  "hex": "#f4c2c2",
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z"
}
```

Register `/colors` **before** `/:id` in Postman.

---

## GET `/api/v1/admin/addons`

**Auth:** Bearer + admin

### Query

| Field | Required | Notes |
|---|---|---|
| `page` | no | default `1` |
| `limit` | no | default `20`, max `100` |
| `q` | no | search |
| `isActive` | no | `"true"` \| `"false"` |

### Payload

None.

### Response `data`

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

Each item is `AddonAdmin`. Message `"ok"`.

---

## POST `/api/v1/admin/addons`

**Auth:** Bearer + admin

### Payload

```json
{
  "name": "Extra balloon bunch",
  "slug": "extra-balloon-bunch",
  "description": null,
  "imageUploadId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "colorId": "66666666-6666-4666-8666-666666666666",
  "isActive": true,
  "pricePaise": 19900,
  "compareAtPaise": null
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | min 2 |
| `slug` | no | min 2 |
| `description` | no | string or `null` |
| `imageUploadId` | no | completed **image** upload or `null` |
| `colorId` | no | existing color uuid or `null` |
| `isActive` | no | default true |
| `pricePaise` | no | positive int or `null` (free) |
| `compareAtPaise` | no | positive int or `null` |

### Response `data`

Raw `Addon` (no `image` / `color`). Message `"addon created"`.

### Errors

- `400` `invalid addon slug`
- `400` `addon image must be an image upload`
- `404` `color not found`
- `409` `addon slug already exists`

---

## GET `/api/v1/admin/addons/:id`

**Auth:** Bearer + admin

Do not use this path for `.../addons/colors`.

### Response `data`

`AddonAdmin` plus `prices`:

```json
{
  "id": "44444444-4444-4444-8444-444444444444",
  "name": "Extra balloon bunch",
  "slug": "extra-balloon-bunch",
  "description": null,
  "imageUploadId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "colorId": "66666666-6666-4666-8666-666666666666",
  "isActive": true,
  "pricePaise": 19900,
  "compareAtPaise": null,
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z",
  "image": null,
  "color": {
    "id": "66666666-6666-4666-8666-666666666666",
    "name": "Pastel pink",
    "slug": "pastel-pink",
    "hex": "#f4c2c2"
  },
  "prices": [
    {
      "id": "77777777-7777-4777-8777-777777777777",
      "addonId": "44444444-4444-4444-8444-444444444444",
      "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "pricePaise": 24900,
      "compareAtPaise": null,
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z"
    }
  ]
}
```

---

## PATCH `/api/v1/admin/addons/:id`

**Auth:** Bearer + admin

### Payload

Same fields as create, all optional. `colorId: null` unsets the color.

```json
{
  "isActive": false,
  "pricePaise": null,
  "colorId": null
}
```

### Response `data`

Raw `Addon`. Message `"addon updated"`.

---

## GET `/api/v1/admin/addons/colors`

**Auth:** Bearer + admin

### Payload

None.

### Response `data`

```json
{
  "items": [
    {
      "id": "66666666-6666-4666-8666-666666666666",
      "name": "Pastel pink",
      "slug": "pastel-pink",
      "hex": "#f4c2c2",
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z"
    }
  ]
}
```

---

## POST `/api/v1/admin/addons/colors`

**Auth:** Bearer + admin

### Payload

```json
{
  "name": "Pastel pink",
  "hex": "#F4C2C2"
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | trim, min 2, max 40 |
| `hex` | yes | `#` + 6 hex digits (case-insensitive; stored lowercase) |

### Response `data`

`AddonColor`. Message `"color created"`.

### Errors

- `400` `invalid hex` / `invalid color name`
- `409` `color already exists`

There is **no** `DELETE /admin/addons/colors/:id`.

---

## PATCH `/api/v1/admin/addons/colors/:id`

**Auth:** Bearer + admin

At least one of `name` or `hex` is required.

### Payload

```json
{
  "name": "Blush pink",
  "hex": "#f4c2c2"
}
```

### Response `data`

`AddonColor`. Message `"color updated"`.

---

## GET `/api/v1/admin/addons/:id/city-prices`

**Auth:** Bearer + admin

### Response `data`

Array of `AddonCityPrice` (see get-by-id `prices` above). Message `"ok"`.

---

## PUT `/api/v1/admin/addons/:id/city-prices`

**Auth:** Bearer + admin

City override must be a positive int (not free). Free add-ons use default `pricePaise: null` and skip a city row.

### Payload

```json
{
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "pricePaise": 24900,
  "compareAtPaise": null
}
```

### Response `data`

One `AddonCityPrice`. Message `"price saved"`.

---

## DELETE `/api/v1/admin/addons/:id/city-prices/:cityId`

**Auth:** Bearer + admin

### Response `data`

```json
{
  "id": "44444444-4444-4444-8444-444444444444",
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
}
```

Message `"price removed"`.
