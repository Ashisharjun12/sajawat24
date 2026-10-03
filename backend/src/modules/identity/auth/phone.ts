import { ApiError } from "@/shared/errors/apiError.js";

const INDIA_MOBILE = /^[6-9]\d{9}$/;

export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (/^0+$/.test(digits)) {
        throw ApiError.badRequest("invalid phone number");
    }

    let local: string;
    if (digits.length === 10) {
        local = digits;
    } else if (digits.length === 12 && digits.startsWith("91")) {
        local = digits.slice(2);
    } else {
        throw ApiError.badRequest("invalid phone number");
    }

    if (/^0+$/.test(local) || !INDIA_MOBILE.test(local)) {
        throw ApiError.badRequest("invalid phone number");
    }

    return `+91${local}`;
}

/** E.164 +91 for SMS providers; returns null instead of throwing (optional transactional SMS). */
export function normalizePhoneForSms(phone: string): string | null {
    try {
        return normalizePhone(phone);
    } catch {
        return null;
    }
}
