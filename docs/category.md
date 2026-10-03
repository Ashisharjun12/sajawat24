# Categories

**Module:** `backend/src/modules/catalog/categories`  
**Public:** `/api/v1/catalog/categories`  
**Admin:** `/api/v1/admin/categories`

Envelope: [README.md](README.md). Overview: [catalog.md](catalog.md). Admin auth: [admin.md](admin.md).

Two levels: `parentId` null = category; set = subcategory (parent must be top-level). Optional `imageUploadId` → one media image (not a gallery).

Top-level categories may include optional `iconKey` and `iconTone` for the customer header bar (Lucide icon + chip color). Subcategories always return `iconKey` / `iconTone` as `null`. The bar `image` field is separate (banner/card photo).

Public and admin category payloads both include resolved `image` with display `url`.

**Clients:** public → customer web/mobile; admin → admin web. Payloads are the same for web and mobile.

## Shape (`CategoryAdmin`)

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "name": "Birthdays",
  "slug": "birthdays",
  "parentId": null,
  "iconKey": "cake",
  "iconTone": "amber",
  "imageUploadId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "isActive": true,
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z",
  "image": {
    "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    "folderId": null,
    "kind": "image",
    "filename": "birthdays.webp",
    "mimeType": "image/webp",
    "size": 48000,
    "status": "completed",
    "width": 800,
    "height": 800,
    "key": "uploads/....",
    "publicUrl": "https://cdn.example/uploads/....",
    "optimizedKey": "uploads/....-opt.webp",
    "optimizedUrl": "https://cdn.example/uploads/....-opt.webp",
    "optimizeStatus": "completed",
    "thumbnailKey": null,
    "thumbnailUrl": null,
    "createdAt": "2026-08-21T18:00:00.000Z",
    "url": "https://cdn.example/uploads/....-opt.webp"
  }
}
```

`image` is `null` when there is no completed upload.

---

## GET `/api/v1/catalog/categories`

**Auth:** public

Active tree only.

### Payload

None.

### Response `data`

```json
[
  {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Birthdays",
    "slug": "birthdays",
    "parentId": null,
    "imageUploadId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    "isActive": true,
    "createdAt": "2026-08-21T18:00:00.000Z",
    "updatedAt": "2026-08-21T18:00:00.000Z",
    "image": null,
    "children": [
      {
        "id": "12121212-1212-4121-8121-121212121212",
        "name": "Theme cradle",
        "slug": "theme-cradle",
        "parentId": "11111111-1111-4111-8111-111111111111",
        "imageUploadId": null,
        "isActive": true,
        "createdAt": "2026-08-21T18:00:00.000Z",
        "updatedAt": "2026-08-21T18:00:00.000Z",
        "image": null
      }
    ]
  }
]
```

Message `"ok"`.

---

## GET `/api/v1/admin/categories`

**Auth:** Bearer + admin

### Query

| Field | Required | Notes |
|---|---|---|
| `page` | no | default `1` |
| `limit` | no | default `20`, max `100` |
| `q` | no | search |
| `isActive` | no | `"true"` \| `"false"` |
| `parentId` | no | uuid = children of that parent; `"null"` or `""` = roots only; omit = all |

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

Each item is `CategoryAdmin` (no `children`). Message `"ok"`.

---

## POST `/api/v1/admin/categories`

**Auth:** Bearer + admin

### Payload

```json
{
  "name": "Birthdays",
  "slug": "birthdays",
  "parentId": null,
  "iconKey": "cake",
  "iconTone": "amber",
  "imageUploadId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "isActive": true
}
```

Subcategory: set `parentId` to a top-level category uuid.

| Field | Required | Notes |
|---|---|---|
| `name` | yes | min 2 |
| `slug` | no | min 2; slugified from name if omitted |
| `parentId` | no | uuid or `null` |
| `iconKey` | no | top-level only: `cake`, `heart`, `baby`, `gem`, `party`, `sparkles`, `building`, `heart-handshake`, `gift`, `flower`; default `sparkles` on create |
| `iconTone` | no | top-level only: `amber`, `rose`, `sky`, `violet`, `orange`, `emerald`, `slate`, `pink`; default `amber` on create |
| `imageUploadId` | no | uuid of a completed **image** upload, or `null` |
| `isActive` | no | boolean |

### Response `data`

`CategoryAdmin`. Message `"category created"`.

### Errors

- `400` `invalid category slug`
- `400` parent is not top-level
- `409` slug already exists

---

## PATCH `/api/v1/admin/categories/:id`

**Auth:** Bearer + admin

### Params

`id` uuid.

### Payload

All optional:

```json
{
  "name": "Birthday decor",
  "slug": "birthday-decor",
  "parentId": null,
  "iconKey": "cake",
  "iconTone": "amber",
  "imageUploadId": null,
  "isActive": false
}
```

Set `imageUploadId` to `null` to clear the image. `iconKey` / `iconTone` apply to top-level categories only; patch clears them when the row is a subcategory.

### Response `data`

`CategoryAdmin`. Message `"category updated"`.

### Errors

- `404` not found
- `400` cannot set parent to self / parent not top-level
- `409` slug conflict
