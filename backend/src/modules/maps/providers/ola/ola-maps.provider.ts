
import { randomUUID } from "node:crypto";
import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type {
    LatLng,
    MapsAutocompleteOptions,
    MapsProvider,
    PlaceDetails,
    PlacePrediction,
    ReverseGeocodeResult,
    RouteResult,
} from "@/modules/maps/maps.types.js";
import {
    assertOlaMapsCredentialsConfigured,
    getOlaAccessToken,
   
} from "@/modules/maps/providers/ola/ola-maps.auth.js";

const OLA_BASE = "https://api.olamaps.io";


function appendApiKey(url: string): string {
    const key = _config.OLA_MAPS_API_KEY?.trim();
    if (!key) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}api_key=${encodeURIComponent(key)}`;
}

async function olaRequest<T>(url: string, init?: RequestInit): Promise<T> {
    assertOlaMapsCredentialsConfigured();

    const token = await getOlaAccessToken();
    const requestUrl = token ? url : appendApiKey(url);

    const headers: Record<string, string> = {
        "X-Request-Id": randomUUID(),
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (init?.headers) {
        const extra = init.headers as Record<string, string>;
        for (const [key, value] of Object.entries(extra)) {
            headers[key] = value;
        }
    }

    const response = await fetch(requestUrl, {
        ...init,
        headers,
    });
    if (!response.ok) {
        const text = await response.text();
        throw ApiError.internalServerError(`ola maps api failed: ${text.slice(0, 300)}`);
    }
    return (await response.json()) as T;
}

function extractIndiaPincode(components: unknown): string | null {
    if (!Array.isArray(components)) return null;
    for (const part of components) {
        if (!part || typeof part !== "object") continue;
        const row = part as Record<string, unknown>;
        const types = row.types;
        const isPostal =
            (Array.isArray(types) && types.some((t) => String(t).toLowerCase().includes("postal"))) ||
            String(row.type ?? "").toLowerCase().includes("postal");
        if (!isPostal) continue;
        const raw = String(row.long_name ?? row.short_name ?? row.text ?? row.value ?? "");
        const digits = raw.replace(/\D/g, "");
        const match = digits.match(/[1-9]\d{5}/);
        if (match) return match[0];
    }
    return null;
}

function readCityName(components: unknown): string | null {
    if (!Array.isArray(components)) return null;
    const prefer = ["locality", "city", "town", "village", "state_district", "district"];
    for (const type of prefer) {
        for (const part of components) {
            if (!part || typeof part !== "object") continue;
            const row = part as Record<string, unknown>;
            const types = row.types;
            const matches =
                (Array.isArray(types) &&
                    types.some((t) => String(t).toLowerCase().includes(type))) ||
                String(row.type ?? "").toLowerCase().includes(type);
            if (!matches) continue;
            const name = String(row.long_name ?? row.short_name ?? row.text ?? row.value ?? "").trim();
            if (name) return name;
        }
    }
    return null;
}

function parseReverseGeocodePayload(data: unknown): ReverseGeocodeResult {
    const root = data as Record<string, unknown>;
    const results =
        root.results ??
        (root.data as Record<string, unknown> | undefined)?.results ??
        root.result;
    const first = Array.isArray(results) ? results[0] : results ?? root;
    const row = first && typeof first === "object" ? (first as Record<string, unknown>) : root;

    const placeName = String(row.name ?? row.title ?? row.poi ?? "").trim() || null;
    const formattedAddress = String(
        row.formatted_address ??
            row.formattedAddress ??
            row.address ??
            row.description ??
            "",
    ).trim();
    const components = row.address_components ?? row.addressComponents ?? row.components;
    const pincode = extractIndiaPincode(components);
    const cityName = readCityName(components);

    const line =
        formattedAddress ||
        placeName ||
        String(row.display_name ?? "").trim() ||
        "Selected location";

    return {
        placeName,
        formattedAddress: line,
        pincode,
        cityName,
    };
}

function readLatLng(obj: unknown): { latitude: number; longitude: number } | null {
    if (!obj || typeof obj !== "object") return null;
    const row = obj as Record<string, unknown>;
    const lat = row.lat ?? row.latitude;
    const lng = row.lng ?? row.longitude ?? row.lon;
    if (typeof lat === "number" && typeof lng === "number") {
        return { latitude: lat, longitude: lng };
    }
    return null;
}

/** Ola Directions may nest payload under `data` / `result`. */
function unwrapOlaDirectionsRoot(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== "object") return {};
    const root = data as Record<string, unknown>;
    if (Array.isArray(root.routes)) return root;
    for (const key of ["data", "result"]) {
        const inner = root[key];
        if (inner && typeof inner === "object") {
            const row = inner as Record<string, unknown>;
            if (Array.isArray(row.routes)) return row;
        }
    }
    return root;
}

function firstDirectionsRoute(root: Record<string, unknown>): Record<string, unknown> | null {
    const routes = root.routes;
    if (!Array.isArray(routes) || !routes[0] || typeof routes[0] !== "object") {
        return null;
    }
    return routes[0] as Record<string, unknown>;
}

function readPolylineField(value: unknown): string | null {
    if (typeof value === "string" && value.length > 0) return value;
    if (value && typeof value === "object") {
        const row = value as Record<string, unknown>;
        const encoded =
            row.points ??
            row.encoded_polyline ??
            row.encodedPolyline ??
            row.polyline;
        if (typeof encoded === "string" && encoded.length > 0) return encoded;
    }
    return null;
}

function findEncodedPolyline(data: unknown): string | null {
    const root = unwrapOlaDirectionsRoot(data);

    const direct =
        root.encoded_polyline ??
        root.encodedPolyline ??
        root.polyline ??
        root.overview_polyline;
    const fromRoot = readPolylineField(direct);
    if (fromRoot) return fromRoot;

    const route = firstDirectionsRoute(root);
    if (!route) return null;

    const fromRoute =
        route.encoded_polyline ??
        route.encodedPolyline ??
        route.polyline ??
        route.overview_polyline;
    const routePolyline = readPolylineField(fromRoute);
    if (routePolyline) return routePolyline;

    const geometry = route.geometry;
    if (typeof geometry === "string" && geometry.length > 0) return geometry;

    const legs = route.legs;
    if (Array.isArray(legs)) {
        for (const leg of legs) {
            if (!leg || typeof leg !== "object") continue;
            const row = leg as Record<string, unknown>;
            const legPolyline = readPolylineField(
                row.polyline ?? row.encoded_polyline ?? row.encodedPolyline,
            );
            if (legPolyline) return legPolyline;
        }
    }

    return null;
}

function readMeterLike(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
    if (typeof value === "string") {
        const asNum = Number.parseFloat(value);
        if (Number.isFinite(asNum)) return Math.round(asNum);
        const stripped = value.replace(/s$/i, "");
        const parsed = Number.parseInt(stripped, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (value && typeof value === "object") {
        const row = value as Record<string, unknown>;
        return readMeterLike(row.value ?? row.meters ?? row.distance);
    }
    return null;
}

function sumLegMetrics(
    route: Record<string, unknown>,
    keys: string[],
): number | null {
    const legs = route.legs;
    if (!Array.isArray(legs) || legs.length === 0) return null;

    let sum = 0;
    let found = false;
    for (const leg of legs) {
        if (!leg || typeof leg !== "object") continue;
        const row = leg as Record<string, unknown>;
        for (const key of keys) {
            const n = readMeterLike(row[key]);
            if (n != null) {
                sum += n;
                found = true;
                break;
            }
        }
    }
    return found ? sum : null;
}

function readDistanceMeters(data: unknown): number | null {
    const root = unwrapOlaDirectionsRoot(data);
    const route = firstDirectionsRoute(root);

    if (route) {
        const onRoute = readMeterLike(
            route.distance ?? route.distanceMeters ?? route.distance_meters,
        );
        if (onRoute != null) return onRoute;

        const fromLegs = sumLegMetrics(route, [
            "distance",
            "distanceMeters",
            "distance_meters",
        ]);
        if (fromLegs != null) return fromLegs;
    }

    return readMeterLike(root.distance ?? root.distanceMeters ?? root.distance_meters);
}

function readDurationSeconds(data: unknown): number {
    const root = unwrapOlaDirectionsRoot(data);
    const route = firstDirectionsRoute(root);

    if (route) {
        const onRoute = readMeterLike(
            route.duration ?? route.durationSeconds ?? route.duration_seconds,
        );
        if (onRoute != null) return onRoute;

        const fromLegs = sumLegMetrics(route, [
            "duration",
            "durationSeconds",
            "duration_seconds",
        ]);
        if (fromLegs != null) return fromLegs;
    }

    const fallback = readMeterLike(
        root.duration ?? root.durationSeconds ?? root.duration_seconds,
    );
    return fallback ?? 0;
}

export class OlaMapsProvider implements MapsProvider {
    async computeRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
        const qs = new URLSearchParams({
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
        });
        const data = await olaRequest<unknown>(
            `${OLA_BASE}/routing/v1/directions/basic?${qs.toString()}`,
            { method: "POST" },
        );

        const encodedPolyline = findEncodedPolyline(data);
        const distanceMeters = readDistanceMeters(data);
        if (!encodedPolyline || distanceMeters == null) {
            throw ApiError.notFound("no route found");
        }

        return {
            encodedPolyline,
            distanceMeters,
            durationSeconds: readDurationSeconds(data),
        };
    }

    async autocomplete(input: string, options?: MapsAutocompleteOptions): Promise<PlacePrediction[]> {
        const trimmed = input.trim();
        if (trimmed.length < 2) return [];

        const qs = new URLSearchParams({ input: trimmed });
        if (options?.location) {
            qs.set(
                "location",
                `${options.location.latitude},${options.location.longitude}`,
            );
        }

        const data = await olaRequest<unknown>(`${OLA_BASE}/places/v1/autocomplete?${qs.toString()}`);

        const predictions =
            (data as Record<string, unknown>).predictions ??
            (data as Record<string, unknown>).suggestions ??
            (data as Record<string, unknown>).results;

        if (!Array.isArray(predictions)) return [];

        const out: PlacePrediction[] = [];
        for (const item of predictions) {
            if (!item || typeof item !== "object") continue;
            const row = item as Record<string, unknown>;
            const placeId = String(row.place_id ?? row.placeId ?? row.id ?? "");
            const description = String(
                row.description ??
                    row.formatted_address ??
                    row.name ??
                    row.title ??
                    "",
            );
            if (placeId && description) {
                out.push({ placeId, description });
            }
        }
        return out;
    }

    async getPlaceDetails(placeId: string, _sessionToken?: string): Promise<PlaceDetails> {
        const qs = new URLSearchParams({ place_id: placeId });
        const data = await olaRequest<unknown>(`${OLA_BASE}/places/v1/details?${qs.toString()}`);

        const result =
            (data as Record<string, unknown>).result ??
            (data as Record<string, unknown>).place ??
            data;

        if (!result || typeof result !== "object") {
            throw ApiError.notFound("place not found");
        }

        const row = result as Record<string, unknown>;
        const geometry = row.geometry ?? row.location;
        let coords = readLatLng(geometry);
        if (!coords && geometry && typeof geometry === "object") {
            coords = readLatLng((geometry as Record<string, unknown>).location);
        }
        if (!coords) {
            coords = readLatLng(row);
        }
        if (!coords) {
            throw ApiError.notFound("place has no coordinates");
        }

        const formattedAddress = String(
            row.formatted_address ?? row.formattedAddress ?? row.address ?? row.name ?? "",
        );

        const components = row.address_components ?? row.addressComponents ?? row.components;

        return {
            placeId: String(row.place_id ?? row.placeId ?? placeId),
            formattedAddress,
            latitude: coords.latitude,
            longitude: coords.longitude,
            pincode: extractIndiaPincode(components),
        };
    }

    async reverseGeocode(location: LatLng): Promise<ReverseGeocodeResult> {
        const qs = new URLSearchParams({
            latlng: `${location.latitude},${location.longitude}`,
        });
        const data = await olaRequest<unknown>(
            `${OLA_BASE}/places/v1/reverse-geocode?${qs.toString()}`,
        );
        return parseReverseGeocodePayload(data);
    }
}

export { getOlaMapStyleUrl } from "@/modules/maps/providers/ola/ola-maps.sdk-config.js";
