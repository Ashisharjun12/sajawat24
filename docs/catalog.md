# Catalog

**Module:** `backend/src/modules/catalog`  
**Public mount:** `/api/v1/catalog`  
**Admin mount:** `/api/v1/admin/categories`, `/products`, `/addons`, `/sections`

Catalog is a city-gated service menu: pincode → city → products that have a sell price in that city. Size, color, cake, extra balloons are **mapped add-ons**, not SKU variants.

| File | Endpoints |
|---|---|
| [category.md](category.md) | Public tree + admin CRUD |
| [products.md](products.md) | Public list + PDP get by pincode; admin CRUD, city prices, add-on map |
| [addons.md](addons.md) | Admin library, colors, city prices (no public addon routes) |
| [sections.md](sections.md) | Sections: global list + per-city replace override |
| [admin.md](admin.md) | Gateway index |

Envelope: [README.md](README.md). Admin auth: [admin.md](admin.md). Geo: [geo.md](geo.md). Images come from [media.md](media.md).

JSON is the same for web and mobile. **Clients:** public routes → customer web/mobile; admin routes → admin web.

## Money

- Integer **paise** only (`49900` = ₹499).
- Never store `0`. `null` = free / no default price.
- City override wins; else product/addon default. No fallback to another city.
- `compareAtPaise` must be `>= pricePaise` when both are set.
- A product appears in an active city if it has a default `pricePaise` **or** a `city_prices` row for that city.

## Leaf rule

`categoryId` on a product is always the **subcategory** (`parentId` set). Parent is derived. Two-level tree only.

## Images

Catalog `image` / `images[].url` is the **display URL**: optimized object if present, else original `publicUrl`.

Admin upload APIs return `publicUrl` + `optimizedUrl` separately (no `url`). See [media.md](media.md).

## Not HTTP

- `getProductForCity(productId, cityId)` — TypeScript helper. Customer PDP uses `GET /catalog/products/:id?pincode=` instead.
- `priceQuote(productId, cityId, addonIds)` → `{ productId, cityId, addonIds, productPaise, addonsPaise, totalPaise }` (for booking later)

Coupons, GST, cart, and slots are not catalog.

---

## GET `/api/v1/catalog/categories`

**Auth:** public  
**Clients:** customer web/mobile

Active two-level tree. Resolved `image` includes display `url`.

### Payload

None.

### Response `data`

Array of top-level categories. Each has `children` (subcategories). Full example: [category.md](category.md).

Message `"ok"`.

---

## GET `/api/v1/catalog/products`

**Auth:** public  
**Clients:** customer web/mobile

Resolves pincode via geo (`assertServiceable`). Returns city + products priced for that city.

### Query

| Field | Required | Notes |
|---|---|---|
| `pincode` | yes | min 6 |
| `categoryId` | no | uuid (subcategory) |

Example: `GET /api/v1/catalog/products?pincode=302001`

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
  "items": []
}
```

Each item is a product with resolved `pricePaise`, `images` (with `url`), and `addonIds`. Full item example: [products.md](products.md).

### Errors

- `400` `pincode not serviceable` / invalid pincode

---

## GET `/api/v1/catalog/products/:id`

**Auth:** public  
**Clients:** customer web/mobile (PDP)

### Query

`pincode` required (min 6). Example: `GET /api/v1/catalog/products/:id?pincode=302001`

### Response `data`

City product (same as a list item) plus `city` and mapped `addons` (`id`, `name`, `slug`, `image`, `color`, `pricePaise`). Inactive add-ons are omitted. `pricePaise: null` = Free.

Full example: [products.md](products.md).

### Errors

- `400` `pincode not serviceable` / `product is not priced for this city`
- `404` `product not found`

---

## GET `/api/v1/catalog/sections`

**Auth:** public  
**Clients:** customer web/mobile

Active sections for a pincode’s city. City override replaces the global product list; otherwise global. Unpriced / inactive products and empty sections are omitted.

### Query

`pincode` required (min 6). Example: `GET /api/v1/catalog/sections?pincode=302001`

### Response `data`

`{ city, sections[] }`. Each section includes `source` (`"city"` \| `"global"`) and `items` (same city product as the list above). Full contract: [sections.md](sections.md).

### Errors

- `400` `pincode not serviceable` / invalid pincode

