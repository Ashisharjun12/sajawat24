import type { RequestHandler } from "express";
import DbFactory from "@/infrastructure/database/db.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { isRateLimitEnabled } from "@/shared/rate-limit/is-rate-limit-enabled.js";
import { logger } from "@/utils/logger.js";

const MAX_REQUESTS = 300;
const WINDOW_SECONDS = 900;

function redisKey(ip: string): string {
    return `rl:api:ip:${ip}`;
}

export const apiRateLimitMiddleware: RequestHandler = async (req, _res, next) => {
    if (!isRateLimitEnabled()) {
        next();
        return;
    }

    if (req.path.startsWith("/webhooks")) {
        next();
        return;
    }

    const ip = req.ip || "unknown";

    try {
        const redis = DbFactory.getRedisDatabase().getClient();
        const key = redisKey(ip);
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, WINDOW_SECONDS);
        }
        if (count > MAX_REQUESTS) {
            next(new ApiError(429, "rate limit exceeded"));
            return;
        }
        next();
    } catch (err) {
        logger.warn({ err, ip }, "api rate limit redis error; allowing request");
        next();
    }
};
