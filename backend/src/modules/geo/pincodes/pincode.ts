import { ApiError } from "@/shared/errors/apiError.js";

const INDIA_PIN = /^[1-9]\d{5}$/;

export function normalizePincode(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (!INDIA_PIN.test(digits)) {
        throw ApiError.badRequest("invalid pincode");
    }
    return digits;
}
