# Media (upload)

**Module:** `backend/src/modules/upload`  
**Admin:** `/api/v1/admin/uploads` and `/api/v1/admin/media-folders`  
**Public:** none (catalog returns display URLs on category/product/addon payloads)

Envelope: [README.md](README.md). Admin auth: [admin.md](admin.md). Catalog uses completed upload ids: [category.md](category.md), [products.md](products.md), [addons.md](addons.md).

**Clients:** admin web. JSON is the same for web and mobile.

Only **multipart** endpoint: `POST /api/v1/admin/uploads/ingest`. Everything else is JSON.

Upload APIs return `PublicMedia` (`publicUrl` / `optimizedUrl` / `thumbnailUrl`). Catalog entities add a single display `url` (optimized if present, else original). Do not expect `url` on upload responses.

## PublicMedia

```json
{
  "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "folderId": null,
  "kind": "image",
  "filename": "cradle.webp",
  "mimeType": "image/webp",
  "size": 48000,
  "status": "completed",
  "width": 1600,
  "height": 900,
  "key": "uploads/image/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/cradle.webp",
  "publicUrl": "https://cdn.example/uploads/image/.../cradle.webp",
  "optimizedKey": "uploads/image/.../cradle-opt.webp",
  "optimizedUrl": "https://cdn.example/uploads/image/.../cradle-opt.webp",
  "optimizeStatus": "completed",
  "thumbnailKey": null,
  "thumbnailUrl": null,
  "createdAt": "2026-08-21T18:00:00.000Z"
}
```

`kind`: `"image"` | `"video"`.  
`status`: `"pending"` | `"completed"` | `"failed"`.  
`optimizeStatus`: `"none"` | `"queued"` | `"completed"` | `"failed"`.

## MediaFolder

```json
{
  "id": "88888888-8888-4888-8888-888888888888",
  "name": "Products",
  "slug": "products",
  "parentId": null,
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z"
}
```

Two folder levels only. A subfolder cannot have children.

---

## GET `/api/v1/admin/uploads`

**Auth:** Bearer + admin

### Query

| Field | Required | Notes |
|---|---|---|
| `page` | no | default `1` |
| `limit` | no | default `20`, max `100` |
| `q` | no | filename search |
| `kind` | no | `"image"` \| `"video"` |
| `folderId` | no | uuid; `"null"` or `""` = unfiled |
| `status` | no | `"pending"` \| `"completed"` \| `"failed"` |
| `optimizeStatus` | no | `"none"` \| `"queued"` \| `"completed"` \| `"failed"` |

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

Each item is `PublicMedia`. Message `"ok"`.

---

## POST `/api/v1/admin/uploads/presign`

**Auth:** Bearer + admin

Direct PUT to R2, **or** tells the client to use ingest when `optimize: true` on an image.

### Payload

```json
{
  "filename": "cradle.jpg",
  "mimeType": "image/jpeg",
  "kind": "image",
  "folderId": null,
  "optimize": false
}
```

| Field | Required | Notes |
|---|---|---|
| `filename` | yes | 1–255 |
| `mimeType` | yes | 3–100 |
| `kind` | yes | `"image"` \| `"video"` |
| `folderId` | no | uuid or `null` |
| `optimize` | no | if `true` **and** `kind` is `image`, no PUT URL is issued |

### Response `data` — direct

```json
{
  "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "folderId": null,
  "kind": "image",
  "filename": "cradle.jpg",
  "mimeType": "image/jpeg",
  "size": null,
  "status": "pending",
  "width": null,
  "height": null,
  "key": "uploads/image/.../cradle.jpg",
  "publicUrl": "https://cdn.example/uploads/image/.../cradle.jpg",
  "optimizedKey": null,
  "optimizedUrl": null,
  "optimizeStatus": "none",
  "thumbnailKey": null,
  "thumbnailUrl": null,
  "createdAt": "2026-08-21T18:00:00.000Z",
  "uploadMode": "direct",
  "uploadUrl": "https://r2.example/presigned-put..."
}
```

Postman: PUT the file bytes to `uploadUrl` (not the API), then `POST /admin/uploads/:id/complete`.

### Response `data` — ingest

When `optimize: true` and `kind: "image"`:

```json
{
  "uploadMode": "ingest"
}
```

Then use `POST /admin/uploads/ingest` with the file.

### Errors

- `400` mime does not match `kind`
- `404` folder not found
- `500` `storage presign is not configured`

---

## POST `/api/v1/admin/uploads/ingest`

**Auth:** Bearer + admin  
**Content-Type:** `multipart/form-data` (not JSON)

Images only. Runs the WebP pipeline (optional crop) and stores a **completed** upload. Max file size **15MB**.

### Payload (form-data)

| Field | Required | Type | Notes |
|---|---|---|---|
| `file` | yes | File | image |
| `filename` | no | text | defaults to original name |
| `folderId` | no | text | uuid |
| `crop` | no | text | JSON string `{ "x", "y", "width", "height" }` |

Postman: Body → form-data. `file` type = File. `crop` example:

```text
{"x":0,"y":0,"width":1600,"height":900}
```

### Response `data`

`PublicMedia` with `status: "completed"`, `mimeType: "image/webp"`, `optimizeStatus: "completed"`. Message `"upload ingested"`.

### Errors

- `400` `file is required`
- `400` `validation failed` (bad `crop` JSON)
- `400` non-image mime

---

## POST `/api/v1/admin/uploads/:id/complete`

**Auth:** Bearer + admin

Call after a successful presigned PUT. Heads the object in storage.

### Params

`id` uuid.

### Payload

None.

### Response `data`

`PublicMedia` with `status: "completed"` and `size` from storage. Message `"upload completed"`.

### Errors

- `404` `upload not found`
- `400` `object not found in storage` (row marked `failed`)

---

## POST `/api/v1/admin/uploads/:id/optimize`

**Auth:** Bearer + admin

Queues crop/resize. **HTTP 202** (not 200). Envelope `statusCode` is `202`.

### Params

`id` uuid.

### Payload

All optional:

```json
{
  "crop": {
    "x": 0,
    "y": 0,
    "width": 1600,
    "height": 900
  },
  "output": {
    "width": 1600,
    "height": 900
  }
}
```

`width` / `height` on `output` are ints 1–4096.

### Response `data`

`PublicMedia` with `optimizeStatus: "queued"`. Message `"optimize queued"`.

---

## GET `/api/v1/admin/uploads/:id`

**Auth:** Bearer + admin

### Response `data`

`PublicMedia`. Message `"ok"`.

### Errors

- `404` `upload not found`

---

## PATCH `/api/v1/admin/uploads/:id`

**Auth:** Bearer + admin

At least one of `folderId` or `filename` is required.

### Payload

```json
{
  "folderId": "88888888-8888-4888-8888-888888888888",
  "filename": "cradle-hero.webp"
}
```

`folderId` may be `null` to unfile.

### Response `data`

`PublicMedia`. Message `"upload updated"`.

---

## DELETE `/api/v1/admin/uploads/:id`

**Auth:** Bearer + admin

### Response `data`

```json
{ "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }
```

Message `"upload deleted"`.

---

## GET `/api/v1/admin/media-folders`

**Auth:** Bearer + admin

### Query

| Field | Required | Notes |
|---|---|---|
| `parentId` | no | omit = full tree; `"null"` or `""` = roots only; uuid = children of that folder |
| `q` | no | filters **root** names when returning a tree |

### Payload

None.

### Response `data` — tree (no `parentId`)

```json
[
  {
    "id": "88888888-8888-4888-8888-888888888888",
    "name": "Products",
    "slug": "products",
    "parentId": null,
    "createdAt": "2026-08-21T18:00:00.000Z",
    "updatedAt": "2026-08-21T18:00:00.000Z",
    "children": [
      {
        "id": "99999999-9999-4999-8999-999999999999",
        "name": "Cradles",
        "slug": "cradles",
        "parentId": "88888888-8888-4888-8888-888888888888",
        "createdAt": "2026-08-21T18:00:00.000Z",
        "updatedAt": "2026-08-21T18:00:00.000Z",
        "children": []
      }
    ]
  }
]
```

### Response `data` — when `parentId` is set

Flat `MediaFolder[]` (no `children`).

---

## POST `/api/v1/admin/media-folders`

**Auth:** Bearer + admin

### Payload

```json
{
  "name": "Products",
  "slug": "products",
  "parentId": null
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | min 2 |
| `slug` | no | min 2; from name if omitted |
| `parentId` | no | uuid or `null`; parent must be a root |

### Response `data`

`MediaFolder`. Message `"folder created"`.

### Errors

- `400` `invalid folder slug`
- `400` `subfolder cannot have children`
- `404` `parent folder not found`
- `409` `folder slug already exists`

---

## PATCH `/api/v1/admin/media-folders/:id`

**Auth:** Bearer + admin

### Payload

All optional:

```json
{
  "name": "Product photos",
  "slug": "product-photos",
  "parentId": null
}
```

### Response `data`

`MediaFolder`. Message `"folder updated"`.

### Errors

- `400` `folder cannot parent itself` / `folder has children` / `subfolder cannot have children`
- `404` folder or parent not found
- `409` slug conflict

---

## DELETE `/api/v1/admin/media-folders/:id`

**Auth:** Bearer + admin

Folder must have no child folders and no files.

### Response `data`

```json
{ "id": "88888888-8888-4888-8888-888888888888" }
```

Message `"folder deleted"`.

### Errors

- `404` `folder not found`
- `409` `folder has child folders` / `folder has files`
