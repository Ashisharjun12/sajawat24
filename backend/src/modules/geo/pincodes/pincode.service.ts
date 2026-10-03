import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import type { ICityRepository } from "@/modules/geo/cities/city.repository.js";
import { publicCity, type PublicCity } from "@/modules/geo/cities/city.public.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import type { IPincodeRepository } from "@/modules/geo/pincodes/pincode.repository.js";
import { normalizePincode } from "@/modules/geo/pincodes/pincode.js";
import type { Pincode } from "@/modules/geo/pincodes/pincode.schema.js";

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
    | "pincode_city_mismatch";

export type PincodeLookupResult = {
    pincode: PincodeLookupPin;
    city: PublicCity | null;
    deliverable: boolean;
    reason?: PincodeLookupReason;
};

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

function toLookupPin(row: {
    pincode: Pincode;
}): NonNullable<PincodeLookupPin> {
    return {
        id: row.pincode.id,
        code: row.pincode.code,
        locality: row.pincode.locality,
        isServiceable: row.pincode.isServiceable,
    };
}

export class PincodeService implements IPincodeService {
    constructor(
        private readonly pincodes: IPincodeRepository,
        private readonly cities: ICityRepository,
    ) {}

    async lookup(pincodeRaw: string, cityId?: string): Promise<PincodeLookupResult> {
        const code = normalizePincode(pincodeRaw);
        const row = await this.pincodes.findByCodeWithCity(code);

        if (cityId) {
            const cityRecord = await this.cities.findById(cityId);
            if (!cityRecord || !cityRecord.isActive) {
                return {
                    pincode: row ? toLookupPin(row) : null,
                    city: cityRecord ? publicCity(cityRecord) : null,
                    deliverable: false,
                    reason: "city_inactive",
                };
            }
            const city = publicCity(cityRecord);
            if (!row) {
                return { pincode: null, city, deliverable: true };
            }
            if (row.pincode.cityId !== cityId) {
                return {
                    pincode: toLookupPin(row),
                    city,
                    deliverable: false,
                    reason: "pincode_city_mismatch",
                };
            }
            if (!row.pincode.isServiceable) {
                return {
                    pincode: toLookupPin(row),
                    city,
                    deliverable: false,
                    reason: "pincode_not_serviceable",
                };
            }
            return {
                pincode: toLookupPin(row),
                city,
                deliverable: true,
            };
        }

        if (!row) {
            return {
                pincode: null,
                city: null,
                deliverable: false,
                reason: "unknown_pin",
            };
        }
        if (!row.city.isActive) {
            return {
                pincode: toLookupPin(row),
                city: publicCity(row.city),
                deliverable: false,
                reason: "city_inactive",
            };
        }
        if (!row.pincode.isServiceable) {
            return {
                pincode: toLookupPin(row),
                city: publicCity(row.city),
                deliverable: false,
                reason: "pincode_not_serviceable",
            };
        }
        return {
            pincode: toLookupPin(row),
            city: publicCity(row.city),
            deliverable: true,
        };
    }

    async resolve(pincodeRaw: string, cityId?: string): Promise<ResolvedPincode> {
        const result = await this.lookup(pincodeRaw, cityId);
        if (!result.deliverable || !result.city) {
            const message =
                result.reason === "pincode_city_mismatch"
                    ? "pincode does not match city"
                    : result.reason === "city_inactive"
                      ? "city not found"
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
