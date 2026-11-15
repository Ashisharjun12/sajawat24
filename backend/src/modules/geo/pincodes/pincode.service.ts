import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import type { ICityRepository } from "@/modules/geo/cities/city.repository.js";
import { publicCity, type PublicCity } from "@/modules/geo/cities/city.public.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import type { IPincodeRepository } from "@/modules/geo/pincodes/pincode.repository.js";
import { normalizePincode } from "@/modules/geo/pincodes/pincode.js";
import type { Pincode } from "@/modules/geo/pincodes/pincode.schema.js";
import { matchPincodeCity } from "@/modules/geo/pincodes/pincode-city-match.js";
import type { PincodePlace } from "@/modules/maps/maps.types.js";
import { logger } from "@/utils/logger.js";

/** Anything that can say where a pincode is (Ola Maps in production). */
export type PincodePlaceSource = {
    geocodePincode(pincode: string): Promise<PincodePlace | null>;
};

export type PincodeLookupPin = {
    id: string;
    code: string;
    locality: string | null;
    isServiceable: boolean;
} | null;

export type PincodeLookupReason =
    | "unknown_pin"
    | "city_inactive"
    | "pincode_not_serviceable"
    | "pincode_city_mismatch"
    /** Ola found the pincode, but its city isn't an active admin city. */
    | "city_not_served"
    /** Ola unreachable and no city to fall back to. */
    | "lookup_unavailable";

export type PincodeLookupResult = {
    pincode: PincodeLookupPin;
    city: PublicCity | null;
    deliverable: boolean;
    reason?: PincodeLookupReason;
    /** Where the pincode is, per Ola, e.g. "Patna, Bihar" (for messages). */
    area?: string | null;
};

const PLACE_CACHE_MAX = 5000;

function placeLabel(place: PincodePlace): string | null {
    const parts = [place.city ?? place.district, place.state].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
}

function lookupPin(code: string, place: PincodePlace | null): NonNullable<PincodeLookupPin> {
    return { id: "", code, locality: place?.city ?? place?.district ?? null, isServiceable: true };
}

export type ResolvedPincode = {
    pincode: {
        id: string;
        code: string;
        locality: string | null;
        isServiceable: boolean;
    };
    city: PublicCity;
    deliverable: boolean;
};

export type DeliveryLocationInput = {
    cityId: string;
    pincode: string;
};

export type CreatePincodeInput = {
    code: string;
    cityId: string;
    locality?: string | null;
    isServiceable?: boolean;
};

export type PatchPincodeInput = {
    cityId?: string;
    locality?: string | null;
    isServiceable?: boolean;
};

export type PincodeAdminListQuery = {
    page?: unknown;
    limit?: unknown;
    cityId?: unknown;
    q?: unknown;
    isServiceable?: unknown;
};

export interface IPincodeService {
    lookup(pincodeRaw: string, cityId?: string): Promise<PincodeLookupResult>;
    resolve(pincodeRaw: string, cityId?: string): Promise<ResolvedPincode>;
    assertDeliveryLocation(input: DeliveryLocationInput): Promise<ResolvedPincode>;
    assertServiceable(pincodeRaw: string): Promise<ResolvedPincode>;
    getCityByPincode(pincodeRaw: string): Promise<PublicCity>;
    listAdmin(
        query: PincodeAdminListQuery,
    ): Promise<{ items: Pincode[]; page: number; limit: number; total: number }>;
    create(input: CreatePincodeInput): Promise<Pincode>;
    patch(id: string, input: PatchPincodeInput): Promise<Pincode>;
}

export class PincodeService implements IPincodeService {
    constructor(
        /** Admin pincode list — only for the admin screens now, not for delivery checks. */
        private readonly pincodes: IPincodeRepository,
        private readonly cities: ICityRepository,
        private readonly places: PincodePlaceSource,
    ) {}

    /** Ola result per pincode (pincode → city never changes). `null` = Ola doesn't know it. */
    private readonly placeCache = new Map<string, PincodePlace | null>();

    private async placeFor(code: string): Promise<PincodePlace | null> {
        if (this.placeCache.has(code)) return this.placeCache.get(code) ?? null;
        const place = await this.places.geocodePincode(code);
        if (this.placeCache.size >= PLACE_CACHE_MAX) {
            // Drop the oldest entry (Map keeps insertion order).
            const oldest = this.placeCache.keys().next().value;
            if (oldest !== undefined) this.placeCache.delete(oldest);
        }
        this.placeCache.set(code, place);
        return place;
    }

    /**
     * Delivery check, no admin pincode list:
     * 1. Ola Maps tells us the pincode's city / district / state.
     * 2. That is matched to an active admin city (name or alias + same state).
     * 3. Matched → deliverable in that city. With `cityId`, the pincode must be in that city.
     */
    async lookup(pincodeRaw: string, cityId?: string): Promise<PincodeLookupResult> {
        const code = normalizePincode(pincodeRaw);

        let selectedCity: PublicCity | null = null;
        if (cityId) {
            const cityRecord = await this.cities.findById(cityId);
            if (!cityRecord || !cityRecord.isActive) {
                return {
                    pincode: null,
                    city: cityRecord ? publicCity(cityRecord) : null,
                    deliverable: false,
                    reason: "city_inactive",
                };
            }
            selectedCity = publicCity(cityRecord);
        }

        let place: PincodePlace | null;
        try {
            place = await this.placeFor(code);
        } catch (err) {
            logger.warn({ err, pincode: code }, "ola pincode lookup failed");
            // Ola down: don't block bookings in the city the customer already chose.
            if (selectedCity) {
                return { pincode: lookupPin(code, null), city: selectedCity, deliverable: true };
            }
            return { pincode: null, city: null, deliverable: false, reason: "lookup_unavailable" };
        }

        const area = place ? placeLabel(place) : null;
        if (!place) {
            return {
                pincode: null,
                city: selectedCity,
                deliverable: false,
                reason: "unknown_pin",
                area,
            };
        }

        const matched = matchPincodeCity(place, await this.cities.listActive());
        if (!matched) {
            return {
                pincode: lookupPin(code, place),
                city: selectedCity,
                deliverable: false,
                reason: "city_not_served",
                area,
            };
        }

        const city = publicCity(matched);
        if (selectedCity && matched.id !== selectedCity.id) {
            return {
                pincode: lookupPin(code, place),
                // The city this pincode really belongs to (so apps can offer to switch).
                city,
                deliverable: false,
                reason: "pincode_city_mismatch",
                area,
            };
        }
        return { pincode: lookupPin(code, place), city, deliverable: true, area };
    }

    async resolve(pincodeRaw: string, cityId?: string): Promise<ResolvedPincode> {
        const result = await this.lookup(pincodeRaw, cityId);
        if (!result.deliverable || !result.city) {
            const message =
                result.reason === "pincode_city_mismatch"
                    ? `pincode is in ${result.city?.name ?? "another city"}, not the selected city`
                    : result.reason === "city_inactive"
                      ? "city not found"
                      : result.reason === "city_not_served"
                        ? `we don't deliver to ${result.area ?? "this pincode"} yet`
                        : "pincode not serviceable";
            throw ApiError.badRequest(message);
        }
        return {
            pincode: result.pincode ?? {
                id: "",
                code: normalizePincode(pincodeRaw),
                locality: null,
                isServiceable: true,
            },
            city: result.city,
            deliverable: true,
        };
    }

    async assertDeliveryLocation(input: DeliveryLocationInput): Promise<ResolvedPincode> {
        return this.resolve(input.pincode, input.cityId);
    }

    async assertServiceable(pincodeRaw: string): Promise<ResolvedPincode> {
        const result = await this.lookup(pincodeRaw);
        if (!result.deliverable || !result.city) {
            throw ApiError.badRequest("pincode not serviceable");
        }
        if (!result.pincode) {
            throw ApiError.badRequest("pincode not serviceable");
        }
        return {
            pincode: result.pincode,
            city: result.city,
            deliverable: true,
        };
    }

    async getCityByPincode(pincodeRaw: string): Promise<PublicCity> {
        const resolved = await this.assertServiceable(pincodeRaw);
        return resolved.city;
    }

    async listAdmin(query: PincodeAdminListQuery) {
        const pagination = parsePagination(query);
        const cityId = typeof query.cityId === "string" ? query.cityId : undefined;
        const q = typeof query.q === "string" ? query.q.replace(/\D/g, "") : "";
        const isServiceable =
            query.isServiceable === "true"
                ? true
                : query.isServiceable === "false"
                  ? false
                  : undefined;
        const { items, total } = await this.pincodes.list(pagination, {
            cityId,
            q: q || undefined,
            isServiceable,
        });
        return { items, page: pagination.page, limit: pagination.limit, total };
    }

    async create(input: CreatePincodeInput): Promise<Pincode> {
        const code = normalizePincode(input.code);
        const city = await this.cities.findById(input.cityId);
        if (!city) {
            throw ApiError.notFound("city not found");
        }
        try {
            return await this.pincodes.insert({
                code,
                cityId: input.cityId,
                locality: input.locality?.trim() || null,
                isServiceable: input.isServiceable ?? true,
            });
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("pincode already exists");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchPincodeInput): Promise<Pincode> {
        const existing = await this.pincodes.findById(id);
        if (!existing) {
            throw ApiError.notFound("pincode not found");
        }
        if (input.cityId) {
            const city = await this.cities.findById(input.cityId);
            if (!city) {
                throw ApiError.notFound("city not found");
            }
        }
        const row = await this.pincodes.update(id, {
            ...(input.cityId ? { cityId: input.cityId } : {}),
            ...(input.locality !== undefined ? { locality: input.locality?.trim() || null } : {}),
            ...(input.isServiceable !== undefined ? { isServiceable: input.isServiceable } : {}),
        });
        if (!row) {
            throw ApiError.notFound("pincode not found");
        }
        return row;
    }
}
