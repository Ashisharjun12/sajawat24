import { normalizePhoneForSms } from "@/modules/identity/auth/phone.js";
import { ApiError } from "@/shared/errors/apiError.js";

export type PaymentCustomerInput = {
    name: string;
    phone: string;
    email?: string;
};

/** Razorpay `customer.contact`: 8–14 chars, digits with optional leading + */
export function razorpayContact(phone: string): string {
    const e164 = normalizePhoneForSms(phone);
    if (!e164) {
        throw ApiError.badRequest(
            "A valid customer phone number is required for online collection",
        );
    }
    return e164;
}

/** Cashfree expects a 10-digit Indian mobile (no country prefix). */
export function cashfreePhone(phone: string): string {
    const e164 = normalizePhoneForSms(phone);
    if (!e164) {
        throw ApiError.badRequest(
            "A valid customer phone number is required for online collection",
        );
    }
    return e164.slice(3);
}

export function paymentCustomerEmail(email?: string): string {
    const trimmed = email?.trim();
    if (trimmed && trimmed.includes("@")) return trimmed;
    return "customer@decoryy.com";
}
