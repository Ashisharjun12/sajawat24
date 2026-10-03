import { createHmac, timingSafeEqual } from "node:crypto";
import { _config } from "@/config/config.js";
import DbFactory from "@/infrastructure/database/db.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";

export const OTP_TTL_SECONDS = 300;

export const OTP_ERROR_CODES = {
    EXPIRED: "OTP_EXPIRED",
    INVALID: "OTP_INVALID",
    ATTEMPTS_EXHAUSTED: "OTP_ATTEMPTS_EXHAUSTED",
} as const;

function otpUnauthorized(message: string, code: string): ApiError {
    const err = ApiError.unauthorized(message);
    err.code = code;
    return err;
}
const RATE_TTL_SECONDS = 3600;
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "login" | "vendor_register";

type OtpRecord = {
    hash: string;
    attempts: number;
    purpose: OtpPurpose;
};

export type VendorPending = {
    name: string;
    email: string;
    phone: string;
    altPhone?: string;
    cityId: string;
    shopAddress: string;
    pincode: string;
    shopImageUploadId?: string;
};

function redis() {
    return DbFactory.getRedisDatabase().getClient();
}

function otpKey(phone: string) {
    return `otp:login:${phone}`;
}

function rateKeyPhone(phone: string) {
    return `otp:rl:${phone}`;
}

function rateKeyIp(ip: string) {
    return `otp:rl:ip:${ip}`;
}

function pendingKey(phone: string) {
    return `vendor:pending:${phone}`;
}

function otpPepper(): string {
    const pepper = _config.OTP_PEPPER || _config.JWT_SECRET;
    if (!pepper) {
        throw new Error("JWT_SECRET or OTP_PEPPER is required to hash OTPs");
    }
    return pepper;
}

export function hashOtp(phone: string, otp: string): string {
    return createHmac("sha256", otpPepper()).update(`${phone}:${otp}`).digest("hex");
}

function hashesMatch(a: string, b: string): boolean {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
}

async function bumpRateLimit(key: string): Promise<number> {
    const pipeline = redis().pipeline();
    pipeline.incr(key);
    pipeline.expire(key, RATE_TTL_SECONDS);
    const results = await pipeline.exec();
    const incr = results?.[0]?.[1];
    return typeof incr === "number" ? incr : 0;
}

export async function assertOtpRateLimit(phone: string, ip?: string): Promise<void> {
    if (_config.NODE_ENV === "development") return;

    const phoneCount = await bumpRateLimit(rateKeyPhone(phone));
    if (phoneCount > MAX_SENDS_PER_HOUR) {
        throw ApiError.badRequest("too many OTP requests, try later");
    }
    if (ip) {
        const ipCount = await bumpRateLimit(rateKeyIp(ip));
        if (ipCount > MAX_SENDS_PER_HOUR) {
            throw ApiError.badRequest("too many OTP requests, try later");
        }
    }
}

export async function peekVendorPending(phone: string): Promise<VendorPending | undefined> {
    const raw = await redis().get(pendingKey(phone));
    if (!raw) return undefined;
    return JSON.parse(raw) as VendorPending;
}

export async function saveOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<void> {
    if (purpose === "vendor_register") {
        const pending = await peekVendorPending(phone);
        if (!pending) {
            throw ApiError.badRequest("vendor registration expired, register again");
        }
    }
    const record: OtpRecord = { hash: hashOtp(phone, otp), attempts: 0, purpose };
    await redis().set(otpKey(phone), JSON.stringify(record), "EX", OTP_TTL_SECONDS);
}

export async function peekOtp(phone: string): Promise<OtpRecord | undefined> {
    const raw = await redis().get(otpKey(phone));
    if (!raw) return undefined;
    return JSON.parse(raw) as OtpRecord;
}

export async function consumeOtp(phone: string, otp: string): Promise<OtpPurpose> {
    const key = otpKey(phone);
    const raw = await redis().getdel(key);
    if (!raw) {
        throw otpUnauthorized("otp expired or not requested", OTP_ERROR_CODES.EXPIRED);
    }

    const record = JSON.parse(raw) as OtpRecord;
    if (record.attempts >= MAX_ATTEMPTS) {
        throw otpUnauthorized("too many invalid otp attempts", OTP_ERROR_CODES.ATTEMPTS_EXHAUSTED);
    }

    if (!hashesMatch(record.hash, hashOtp(phone, otp))) {
        record.attempts += 1;
        if (record.attempts < MAX_ATTEMPTS) {
            await redis().set(key, JSON.stringify(record), "EX", OTP_TTL_SECONDS);
        }
        throw otpUnauthorized("invalid otp", OTP_ERROR_CODES.INVALID);
    }

    return record.purpose;
}

export async function saveVendorPending(phone: string, pending: VendorPending): Promise<void> {
    await redis().set(pendingKey(phone), JSON.stringify(pending), "EX", OTP_TTL_SECONDS);
}

export async function takeVendorPending(phone: string): Promise<VendorPending> {
    const raw = await redis().getdel(pendingKey(phone));
    if (!raw) {
        throw ApiError.badRequest("vendor registration expired, register again");
    }
    return JSON.parse(raw) as VendorPending;
}
