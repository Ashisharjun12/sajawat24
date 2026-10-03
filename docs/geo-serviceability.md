# Geo serviceability (city-level)

## Rules

Delivery is allowed when:

1. **`cityId`** points to an **active** city (`cities.is_active`).
2. **PIN** is a valid 6-digit code.
3. **`cityId` on the order/address matches** the bag or selected market city.
4. If a row exists in **`pincodes`** for that code:
   - `is_serviceable` must be `true`.
   - `pincodes.city_id` must match the expected `cityId`.
5. If **no** `pincodes` row exists, delivery is still allowed for that city (neighbor PIN cases).

Instant bookings use the same PIN/city rules plus existing **map pin**, marketplace, and **dispatch** constraints.

## API

- `GET /api/v1/geo/resolve?pincode=&cityId=` — always **200** with `{ pincode, city, deliverable, reason? }`.
- Server-side checkout uses `assertDeliveryLocation({ cityId, pincode })` which throws on hard failures.

## Admin PINs

The Pincodes tab is a **denylist / reference** tool. Turning a city on is enough to open scheduled booking for that market without loading every PIN.

## Related

- [vendor-map-matching.md](./vendor-map-matching.md) — instant dispatch (Redis GEO, no Google for matching).
- [maps-integration.md](./maps-integration.md) — Places, Routes, pins, and tracking UX.
