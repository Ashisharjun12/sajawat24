# Geo

**Module:** `backend/src/modules/geo`  
**Public mount:** `/api/v1/geo`  
**Admin mount:** `/api/v1/admin/cities` and `/api/v1/admin/pincodes` (not under `/geo`)

Envelope: see [README.md](README.md). Admin auth: [admin.md](admin.md).

JSON bodies are the same for web and mobile. Catalog public list uses pincode resolve internally ([products.md](products.md)).

## Shapes

### PublicCity

```json
{
  "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "name": "Jaipur",
  "slug": "jaipur",
  "state": "Rajasthan"
}
```

### City (admin)

```json
{
  "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "name": "Jaipur",
  "slug": "jaipur",
  "state": "Rajasthan",
  "isActive": true,
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z"
}
```

### Pincode (admin)

```json
{
  "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "code": "302001",
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "isServiceable": true,
  "locality": "MI Road",
  "createdAt": "2026-08-21T18:00:00.000Z",
  "updatedAt": "2026-08-21T18:00:00.000Z"
}
```

---

## GET `/api/v1/geo/cities`

**Auth:** public  
**Clients:** customer web/mobile, admin map dialog

Active cities only. No query.

### Payload

None.

### Response `data`

```json
[
  {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "name": "Jaipur",
    "slug": "jaipur",
    "state": "Rajasthan"
  }
]
```

Message `"ok"`.

---

## GET `/api/v1/geo/resolve`

**Auth:** public  
**Clients:** customer web/mobile (pincode gate)

### Query

| Field | Required | Notes |
|---|---|---|
| `pincode` | yes | min length 1; must be a serviceable Indian 6-digit code |

Example: `GET /api/v1/geo/resolve?pincode=302001`

### Payload

None.

### Response `data`

```json
{
  "pincode": {
    "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    "code": "302001",
    "locality": "MI Road",
    "isServiceable": true
  },
  "city": {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "name": "Jaipur",
    "slug": "jaipur",
    "state": "Rajasthan"
  }
}
```

### Errors

- `400` `invalid pincode`
- `400` `pincode not serviceable` (missing, not serviceable, or city inactive)

---

## GET `/api/v1/admin/cities`

**Auth:** Bearer + admin  
**Clients:** admin web

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
  "items": [
    {
      "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "name": "Jaipur",
      "slug": "jaipur",
      "state": "Rajasthan",
      "isActive": true,
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

---

## POST `/api/v1/admin/cities`

**Auth:** Bearer + admin  
**Clients:** admin web

### Payload (web = mobile)

```json
{
  "name": "Jaipur",
  "state": "Rajasthan",
  "slug": "jaipur",
  "isActive": true
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | min 2 |
| `state` | yes | min 2 |
| `slug` | no | min 2; generated from name if omitted |
| `isActive` | no | default true |

### Response `data`

Full `City`. Message `"city created"`.

### Errors

- `400` invalid slug
- `409` name or slug exists

---

## PATCH `/api/v1/admin/cities/:id`

**Auth:** Bearer + admin  
**Clients:** admin web

### Params

`id` uuid.

### Payload

All optional:

```json
{
  "name": "Jaipur",
  "state": "Rajasthan",
  "slug": "jaipur",
  "isActive": false
}
```

### Response `data`

Full `City`. Message `"city updated"`.

### Errors

- `404` city not found
- `400` invalid slug
- `409` conflict

---

## GET `/api/v1/admin/pincodes`

**Auth:** Bearer + admin  
**Clients:** admin web

### Query

| Field | Required | Notes |
|---|---|---|
| `page` | no | default `1` |
| `limit` | no | default `20`, max `100` |
| `cityId` | no | uuid |
| `q` | no | search |
| `isServiceable` | no | `"true"` \| `"false"` |

### Payload

None.

### Response `data`

```json
{
  "items": [
    {
      "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      "code": "302001",
      "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "isServiceable": true,
      "locality": "MI Road",
      "createdAt": "2026-08-21T18:00:00.000Z",
      "updatedAt": "2026-08-21T18:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

---

## POST `/api/v1/admin/pincodes`

**Auth:** Bearer + admin  
**Clients:** admin web

### Payload

```json
{
  "code": "302001",
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "locality": "MI Road",
  "isServiceable": true
}
```

| Field | Required | Notes |
|---|---|---|
| `code` | yes | min 6 |
| `cityId` | yes | uuid of an existing city |
| `locality` | no | min 1 or `null` |
| `isServiceable` | no | default true |

### Response `data`

Full `Pincode`. Message `"pincode created"`.

### Errors

- `400` invalid pincode format
- `404` city not found
- `409` `pincode already exists`

---

## PATCH `/api/v1/admin/pincodes/:id`

**Auth:** Bearer + admin  
**Clients:** admin web

### Params

`id` uuid.

### Payload

All optional (`code` cannot be changed):

```json
{
  "cityId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "locality": "C-Scheme",
  "isServiceable": false
}
```

### Response `data`

Full `Pincode`. Message `"pincode updated"`.

### Errors

- `404` pincode or city not found
