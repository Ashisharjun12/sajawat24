import DbFactory from "@/infrastructure/database/db.factory.js";

function redis() {
    return DbFactory.getRedisDatabase().getClient();
}

export function onlineVendorsKey(cityId: string): string {
    return `vendors:online:${cityId}`;
}

export function vendorMetaKey(vendorId: string): string {
    return `vendor:${vendorId}:meta`;
}

export function bookingLocationKey(orderId: string): string {
    return `booking:${orderId}:location`;
}

export async function geoAddVendorOnline(
    cityId: string,
    vendorId: string,
    longitude: number,
    latitude: number,
): Promise<void> {
    const client = redis();
    await client.geoadd(onlineVendorsKey(cityId), longitude, latitude, vendorId);
    await client.hset(vendorMetaKey(vendorId), {
        last_seen: String(Date.now()),
        city_id: cityId,
    });
}

export async function geoRemoveVendorOnline(cityId: string, vendorId: string): Promise<void> {
    await redis().zrem(onlineVendorsKey(cityId), vendorId);
}

export type GeoSearchHit = { vendorId: string; distanceMeters: number };

export async function geoSearchNearby(
    cityId: string,
    longitude: number,
    latitude: number,
    radiusKm: number,
    count: number,
): Promise<GeoSearchHit[]> {
    const client = redis();
    const raw = await client.geosearch(
        onlineVendorsKey(cityId),
        "FROMLONLAT",
        longitude,
        latitude,
        "BYRADIUS",
        radiusKm,
        "km",
        "ASC",
        "COUNT",
        count,
        "WITHDIST",
    );

    const hits: GeoSearchHit[] = [];
    for (const entry of raw) {
        if (!Array.isArray(entry) || entry.length < 2) continue;
        const vendorId = String(entry[0]);
        const distKm = Number(entry[1]);
        if (!vendorId || !Number.isFinite(distKm)) continue;
        hits.push({ vendorId, distanceMeters: Math.round(distKm * 1000) });
    }
    return hits;
}

export type BookingLocation = {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    at: string;
};

export async function setBookingLocation(
    orderId: string,
    location: BookingLocation,
): Promise<void> {
    const client = redis();
    await client.hset(bookingLocationKey(orderId), {
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        heading: location.heading !== undefined ? String(location.heading) : "",
        speed: location.speed !== undefined ? String(location.speed) : "",
        at: location.at,
    });
    await client.expire(bookingLocationKey(orderId), 86_400);
}

export async function getBookingLocation(orderId: string): Promise<BookingLocation | null> {
    const row = await redis().hgetall(bookingLocationKey(orderId));
    if (!row.latitude || !row.longitude || !row.at) return null;
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
        latitude,
        longitude,
        heading: row.heading ? Number(row.heading) : undefined,
        speed: row.speed ? Number(row.speed) : undefined,
        at: row.at,
    };
}

export async function touchVendorHeartbeat(vendorId: string, cityId: string): Promise<void> {
    await redis().hset(vendorMetaKey(vendorId), {
        last_seen: String(Date.now()),
        city_id: cityId,
    });
}

export async function getVendorLastSeen(vendorId: string): Promise<number | null> {
    const raw = await redis().hget(vendorMetaKey(vendorId), "last_seen");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}
