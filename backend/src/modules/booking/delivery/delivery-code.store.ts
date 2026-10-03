import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { _config } from "@/config/config.js";
import DbFactory from "@/infrastructure/database/db.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";

export const DELIVERY_CODE_TTL_SECONDS = 1800;
const RATE_TTL_SECONDS = 3600;
const MAX_SENDS_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;

type DeliveryCodeRecord = {
    hash: string;
    attempts: number;
    sentAt: string;
    sentByVendorId: string;
};

function redis() {
    return DbFactory.getRedisDatabase().getClient();
}

function codeKey(orderId: string) {
    return `delivery:code:${orderId}`;
}

function sendRateKey(orderId: string) {
    return `delivery:rl:send:${orderId}`;
}

function pepper(): string {
    const value = _config.OTP_PEPPER || _config.JWT_SECRET;
    if (!value) {
        throw new Error("JWT_SECRET or OTP_PEPPER is required to hash delivery codes");
    }
    return value;
}

function hashDeliveryCode(orderId: string, code: string): string {
    return createHmac("sha256", pepper()).update(`delivery:${orderId}:${code}`).digest("hex");
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

export function generateDeliveryCode(): string {
    return String(randomInt(100000, 1000000));
}

export async function assertDeliveryCodeSendRateLimit(orderId: string): Promise<void> {
    const count = await bumpRateLimit(sendRateKey(orderId));
    if (count > MAX_SENDS_PER_HOUR) {
        throw ApiError.badRequest("too many delivery code requests, try later");
    }
}

export async function saveDeliveryCode(
    orderId: string,
    code: string,
    sentByVendorId: string,
): Promise<string> {
    const sentAt = new Date().toISOString();
    const record: DeliveryCodeRecord = {
        hash: hashDeliveryCode(orderId, code),
        attempts: 0,
        sentAt,
        sentByVendorId,
    };
    await redis().set(codeKey(orderId), JSON.stringify(record), "EX", DELIVERY_CODE_TTL_SECONDS);
    return sentAt;
}

export async function hasDeliveryCodePending(orderId: string): Promise<boolean> {
    const exists = await redis().exists(codeKey(orderId));
    return exists === 1;
}

export async function consumeDeliveryCode(orderId: string, code: string): Promise<void> {
    const key = codeKey(orderId);
    const raw = await redis().get(key);
    if (!raw) {
        throw ApiError.unauthorized("delivery code expired or not sent");
    }

    const record = JSON.parse(raw) as DeliveryCodeRecord;
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
        throw new ApiError(429, "too many invalid delivery code attempts, resend code");
    }

    if (!hashesMatch(record.hash, hashDeliveryCode(orderId, code))) {
        record.attempts += 1;
        if (record.attempts < MAX_VERIFY_ATTEMPTS) {
            const ttl = await redis().ttl(key);
            const expire = ttl > 0 ? ttl : DELIVERY_CODE_TTL_SECONDS;
            await redis().set(key, JSON.stringify(record), "EX", expire);
        } else {
            await redis().del(key);
        }
        throw ApiError.unauthorized("invalid delivery code");
    }

    await redis().del(key);
}
