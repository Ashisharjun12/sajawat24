# Products

**Module:** `backend/src/modules/catalog/products` (+ pricing + add-on map)  
**Public:** `/api/v1/catalog/products`  
**Admin:** `/api/v1/admin/products`

Envelope: [README.md](README.md). Overview: [catalog.md](catalog.md). Admin auth: [admin.md](admin.md).

`categoryId` must be a **subcategory**. Money is integer paise; `null` = no default / free. Create always inserts `isActive: false` first; `isActive: true` only applies if the product is publishable (at least one image **and** default `pricePaise` or at least one city price). At least one of `scheduledEnabled` / `instantEnabled` must be true (defaults: scheduled `true`, instant `false`).

**Clients:** public → customer web/mobile; admin → admin web. Payloads are the same for web and mobile.

## Shared product fields

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "name": "Theme cradle",
  "slug": "theme-cradle",
  "description": "Balloon backdrop and cradle setup",
  "categoryId": "12121212-1212-4121-8121-121212121212",
  "isActive": false,
  "scheduledEnabled": true,
  "instantEnabled": false,
  "pricePaise": 49900,
  "compareAtPaise": 59900,
  "includes": ["Backdrop", "Balloons"],
  "deliverySetup": ["Setup at venue"],
  "careInstructions": ["Keep away from heat"],
  "faqs": [{ "question": "How long does setup take?", "answer": "About 90 minutes." }],
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z"
}
```

Admin list/get also include `images` and `addonIds`. List adds `categoryName` and `canPublish`. Get adds `prices` and `category`.

### Product image (`images[]`)

`PublicMedia` plus `uploadId`, `sortIndex`, and display `url`.

---

## GET `/api/v1/catalog/products`

**Auth:** public

### Query

| Field | Required | Notes |
|---|---|---|
| `pincode` | yes | min 6 |
| `categoryId` | no | uuid (subcategory) |

`GET /api/v1/catalog/products?pincode=302001&categoryId=12121212-1212-4121-8121-121212121212`

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
  "items": [
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "name": "Theme cradle",
      "slug": "theme-cradle",
      "description": "Balloon backdrop and cradle setup",
      "categoryId": "12121212-1212-4121-8121-121212121212",
      "isActive": true,
      "scheduledEnabled": true,
      "instantEnabled": false,
      "pricePaise": 49900,
      "compareAtPaise": 59900,
      "includes": ["Backdrop"],
      "deliverySetup": [],
      "careInstructions": [],
      "faqs": [],
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z",
      "images": [],
      "addonIds": ["44444444-4444-4444-8444-444444444444"]
    }
  ]
}
```

`items[].pricePaise` is the **resolved sell price** for that city (override or default). No nested `prices` or `category` object.

### Errors

- `400` `pincode not serviceable` / invalid pincode

---

## GET `/api/v1/catalog/products/:id`

**Auth:** public  
**Clients:** customer web/mobile (PDP)

Active product priced for the pincode’s city, plus mapped **active** add-ons (name, image, color, city sell price).

### Params

`id` uuid.

### Query

| Field | Required | Notes |
|---|---|---|
| `pincode` | yes | min 6 |

`GET /api/v1/catalog/products/33333333-3333-4333-8333-333333333333?pincode=302001`

### Payload

None.

### Response `data`

Same product fields as a list item, plus `city` and `addons` (list items only have `addonIds`).

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "name": "Theme cradle",
  "slug": "theme-cradle",
  "description": "Balloon backdrop and cradle setup",
  "categoryId": "12121212-1212-4121-8121-121212121212",
  "isActive": true,
  "scheduledEnabled": true,
  "instantEnabled": false,
  "pricePaise": 49900,
  "compareAtPaise": 59900,
  "includes": ["Backdrop"],
  "deliverySetup": [],
  "careInstructions": [],
  "faqs": [],
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z",
  "images": [],
  "addonIds": ["44444444-4444-4444-8444-444444444444"],
  "city": {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "name": "Jaipur",
    "slug": "jaipur",
    "state": "Rajasthan"
  },
  "addons": [
    {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "Extra balloon bunch",
      "slug": "extra-balloon-bunch",
      "image": {
        "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        "url": "https://cdn.example/uploads/....-opt.webp"
      },
      "color": {
        "id": "66666666-6666-4666-8666-666666666666",
        "name": "Pastel pink",
        "slug": "pastel-pink",
        "hex": "#f4c2c2"
      },
      "pricePaise": 19900
    }
  ]
}
```

`image` is full `PublicMedia` + display `url`, or `null`. `color` may be `null`. `pricePaise: null` = Free.

### Errors

- `400` `pincode not serviceable` / invalid pincode
- `400` `product is not priced for this city`
- `404` `product not found` (missing or inactive)

---

## GET `/api/v1/admin/products`

**Auth:** Bearer + admin

### Query

| Field | Required | Notes |
|---|---|---|
| `page` | no | default `1` |
| `limit` | no | default `20`, max `100` |
| `q` | no | search |
| `isActive` | no | `"true"` \| `"false"` |
| `categoryId` | no | uuid (subcategory) |
| `cityId` | no | uuid. Product is sellable in that city (default `pricePaise` or a `city_prices` row). With `price=none`, the opposite: not sellable there. |
| `price` | no | `"none"` (no resolved sell price) \| `"set"` (has sell price) \| `"sale"` (resolved `compareAtPaise` set). Resolved pair is city override then default. |

### Payload

None.

### Response `data`

```json
{
  "items": [
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "name": "Theme cradle",
      "slug": "theme-cradle",
      "description": null,
      "categoryId": "12121212-1212-4121-8121-121212121212",
      "isActive": false,
      "scheduledEnabled": true,
      "instantEnabled": false,
      "pricePaise": 49900,
      "compareAtPaise": null,
      "includes": [],
      "deliverySetup": [],
      "careInstructions": [],
      "faqs": [],
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z",
      "images": [],
      "addonIds": [],
      "categoryName": "Theme cradle",
      "canPublish": false
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

---

## POST `/api/v1/admin/products`

**Auth:** Bearer + admin

Inserts as draft (`isActive: false`). If the body sends `"isActive": true`, it publishes only after images + price checks pass.

### Payload

```json
{
  "name": "Theme cradle",
  "slug": "theme-cradle",
  "description": "Balloon backdrop and cradle setup",
  "categoryId": "12121212-1212-4121-8121-121212121212",
  "isActive": false,
  "scheduledEnabled": true,
  "instantEnabled": false,
  "imageUploadIds": ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"],
  "includes": ["Backdrop", "Balloons"],
  "deliverySetup": ["Setup at venue"],
  "careInstructions": ["Keep away from heat"],
  "faqs": [
    {
      "question": "How long does setup take?",
      "answer": "About 90 minutes."
    }
  ],
  "pricePaise": 49900,
  "compareAtPaise": 59900
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | min 2 |
| `slug` | no | min 2 |
| `description` | no | string or `null` |
| `categoryId` | yes | uuid of a subcategory |
| `isActive` | no | publish flag; create still starts inactive |
| `scheduledEnabled` | no | default true |
| `instantEnabled` | no | default false |
| `imageUploadIds` | no | uuid[] of completed uploads |
| `includes` | no | string[] max 20 |
| `deliverySetup` | no | string[] max 20 |
| `careInstructions` | no | string[] max 20 |
| `faqs` | no | `{ question, answer }[]` max 20 |
| `pricePaise` | no | positive int or `null` |
| `compareAtPaise` | no | positive int or `null`; `>= pricePaise` if both set |

### Response `data`

`ProductAdminDetail` (product + `images` + `addonIds` + `prices` + `category`). Message `"product created"`.

### Errors

- `400` `invalid product slug`
- `400` `product needs scheduled or instant booking`
- `400` `product needs at least one image to publish`
- `400` missing price when publishing
- `400` `category not found` / not a subcategory
- `409` `product slug already exists`
- `400` `compareAtPaise must be greater than or equal to pricePaise`

---

## GET `/api/v1/admin/products/:id`

**Auth:** Bearer + admin

### Params

`id` uuid.

### Payload

None.

### Response `data`

`ProductAdminDetail`:

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "name": "Theme cradle",
  "slug": "theme-cradle",
  "description": "Balloon backdrop and cradle setup",
  "categoryId": "12121212-1212-4121-8121-121212121212",
  "isActive": false,
  "scheduledEnabled": true,
  "instantEnabled": false,
  "pricePaise": 49900,
  "compareAtPaise": 59900,
  "includes": ["Backdrop"],
  "deliverySetup": [],
  "careInstructions": [],
  "faqs": [],
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z",
  "images": [],
  "addonIds": ["44444444-4444-4444-8444-444444444444"],
  "prices": [
    {
      "id": "55555555-5555-4555-8555-555555555555",
      "productId": "33333333-3333-4333-8333-333333333333",
      "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "pricePaise": 54900,
      "compareAtPaise": null,
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z"
    }
  ],
  "category": {
    "id": "12121212-1212-4121-8121-121212121212",
    "name": "Theme cradle",
    "slug": "theme-cradle",
    "parentId": "11111111-1111-4111-8111-111111111111",
    "imageUploadId": null,
    "isActive": true,
    "createdAt": "2026-08-21T18:00:00.000Z",
    "updatedAt": "2026-08-21T18:00:00.000Z"
  }
}
```

`category` on detail is the raw category row (no resolved `image`).

---

## PATCH `/api/v1/admin/products/:id`

**Auth:** Bearer + admin

### Params

`id` uuid.

### Payload

Same fields as create, all optional. Sending `imageUploadIds` **replaces** the gallery.

```json
{
  "name": "Theme cradle deluxe",
  "isActive": true,
  "pricePaise": 54900,
  "imageUploadIds": ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"]
}
```

### Response `data`

`ProductAdminDetail`. Message `"product updated"`.

---

## DELETE `/api/v1/admin/products/:id`

**Auth:** Bearer + admin

Hard delete.

### Response `data`

```json
{ "id": "33333333-3333-4333-8333-333333333333" }
```

Message `"product deleted"`.

---

## GET `/api/v1/admin/products/:id/city-prices`

**Auth:** Bearer + admin

### Response `data`

```json
[
  {
    "id": "55555555-5555-4555-8555-555555555555",
    "productId": "33333333-3333-4333-8333-333333333333",
    "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "pricePaise": 54900,
    "compareAtPaise": null,
    "createdAt": "2026-08-21T18:00:00.000Z",
    "updatedAt": "2026-08-21T18:00:00.000Z"
  }
]
```

---

## PUT `/api/v1/admin/products/:id/city-prices`

**Auth:** Bearer + admin

Upsert one city override. `pricePaise` is required and must be a positive int (not free).

### Payload

```json
{
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "pricePaise": 54900,
  "compareAtPaise": 64900
}
```

### Response `data`

One `CityPrice` row. Message `"price saved"`.

---

## DELETE `/api/v1/admin/products/:id/city-prices/:cityId`

**Auth:** Bearer + admin

### Params

`id`, `cityId` uuids.

### Response `data`

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
}
```

Message `"price removed"`.

---

## POST `/api/v1/admin/products/:id/addons`

**Auth:** Bearer + admin

Map an existing add-on from the library onto this product.

### Payload

```json
{
  "addonId": "44444444-4444-4444-8444-444444444444"
}
```

### Response `data`

```json
{
  "productId": "33333333-3333-4333-8333-333333333333",
  "addonId": "44444444-4444-4444-8444-444444444444"
}
```

Message `"addon mapped"`.

---

## DELETE `/api/v1/admin/products/:id/addons/:addonId`

**Auth:** Bearer + admin

### Response `data`

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "addonId": "44444444-4444-4444-8444-444444444444"
}
```

Message `"addon unmapped"`.
