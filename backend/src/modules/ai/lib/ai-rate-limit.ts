import DbFactory from "@/infrastructure/database/db.factory.js";
import { ApiError } from "@/shared/errors/apiError.js";

export async function assertAiRateLimit(
    key: string,
    limit: number,
    windowSeconds = 3600,
): Promise<void> {
    const redis = DbFactory.getRedisDatabase().getClient();
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, windowSeconds);
    }
    if (count > limit) {
        throw new ApiError(429, "AI rate limit exceeded — try again later");
    }
}
