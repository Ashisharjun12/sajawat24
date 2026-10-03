import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";

const ANDROID_HASH_PATTERN = /^[A-Za-z0-9+/=]{11}$/;

export function interpolate(
    template: string,
    data: Record<string, string>,
    required: string[],
): string {
    for (const key of required) {
        if (!data[key]?.length) {
            throw ApiError.badRequest(`missing template variable ${key}`);
        }
    }
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => data[key] ?? "");
}

export function bookingTrackUrl(orderId: string): string {
    const origin = (_config.WEB_APP_ORIGIN || "http://localhost:5174").replace(/\/$/, "");
    return `${origin}/account/bookings/${orderId}`;
}

export function formatInrPaise(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function formatLoginOtpSms(otp: string, androidAppHash?: string): string {
    const hash = androidAppHash?.trim();
    if (hash && ANDROID_HASH_PATTERN.test(hash)) {
        return `<#> Your Decoryy code is ${otp}\n${hash}`;
    }
    return `Your Decoryy code is ${otp}. Valid for 5 minutes.`;
}
