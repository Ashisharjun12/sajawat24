import type { RequestHandler } from "express";
import DbFactory from "@/infrastructure/database/db.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { isRateLimitEnabled } from "@/shared/rate-limit/is-rate-limit-enabled.js";
import { logger } from "@/utils/logger.js";

/**
 * Typed coupon codes are the only way to reach hidden coupons, so cap guessing. The global API
 * limiter (300 requests / 15 min / IP) is too loose for this. 10 tries a minute is plenty for a
 * real customer fixing a typo.
 */
const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 60;

export const couponAttemptRateLimit: RequestHandler = async (req, _res, next) => {
    if (!isRateLimitEnabled()) {
        next();
        return;
    }

    const ip = req.ip || "unknown";
    try {
        const redis = DbFactory.getRedisDatabase().getClient();
        const key = `rl:coupon:apply:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, WINDOW_SECONDS);
        }
        if (count > MAX_ATTEMPTS) {
            next(new ApiError(429, "too many coupon attempts, try again in a minute"));
            return;
        }
        next();
    } catch (err) {
        logger.warn({ err, ip }, "coupon rate limit redis error; allowing request");
        next();
    }
};
