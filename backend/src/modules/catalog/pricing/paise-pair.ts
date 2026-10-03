import { ApiError } from "@/shared/errors/apiError.js";

export function assertPaisePair(pricePaise: number, compareAtPaise?: number | null): number | null {
    if (!Number.isInteger(pricePaise) || pricePaise < 0) {
        throw ApiError.badRequest("pricePaise must be a non-negative integer");
    }
    if (pricePaise === 0) {
        if (compareAtPaise == null) return null;
        if (!Number.isInteger(compareAtPaise) || compareAtPaise <= 0) {
            throw ApiError.badRequest("compareAtPaise must be an integer greater than 0");
        }
        return compareAtPaise;
    }
    if (compareAtPaise == null) return null;
    if (!Number.isInteger(compareAtPaise) || compareAtPaise <= 0) {
        throw ApiError.badRequest("compareAtPaise must be an integer greater than 0");
    }
    if (compareAtPaise < pricePaise) {
        throw ApiError.badRequest("compareAtPaise must be greater than or equal to pricePaise");
    }
    return compareAtPaise === pricePaise ? null : compareAtPaise;
}

/** Compare-at for PDP when sell price may be 0 (free add-on). */
export function resolvedCompareAtPaise(
    pricePaise: number | null,
    compareAtPaise: number | null | undefined,
): number | null {
    if (pricePaise == null) return null;
    if (compareAtPaise == null) return null;
    if (pricePaise === 0) return compareAtPaise > 0 ? compareAtPaise : null;
    return compareAtPaise > pricePaise ? compareAtPaise : null;
}

export function normalizeDefaultPaisePair(
    pricePaise?: number | null,
    compareAtPaise?: number | null,
): { pricePaise: number | null; compareAtPaise: number | null } {
    if (pricePaise == null) {
        return { pricePaise: null, compareAtPaise: null };
    }
    return { pricePaise, compareAtPaise: assertPaisePair(pricePaise, compareAtPaise) };
}

export function resolvedSellPaise(
    overridePaise: number | null | undefined,
    defaultPaise: number | null | undefined,
): number | null {
    return overridePaise ?? defaultPaise ?? null;
}
