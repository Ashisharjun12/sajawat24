import { RedisSingleton } from "@/infrastructure/database/provider/redis.singleton.js";
import { logger } from "@/utils/logger.js";
import { isCacheEnabled, resolveCacheRedisUrl, setRuntimeCacheEnabled } from "./cache.config.js";

export class CacheFactory {
    private static connected = false;

    static getRedis() {
        const url = resolveCacheRedisUrl();
        if (!url) {
            throw new Error("Cache Redis URL is not configured (REDIS_CACHE_URL or REDIS_URL + REDIS_CACHE_DB)");
        }
        return RedisSingleton.getInstance(url);
    }

    static async connect(): Promise<void> {
        if (!isCacheEnabled()) {
            logger.info("Application cache is disabled (CACHE_ENABLED=false)");
            return;
        }
        const url = resolveCacheRedisUrl();
        if (!url) {
            logger.warn("Cache Redis URL missing; public response cache disabled");
            setRuntimeCacheEnabled(false);
            return;
        }
        if (this.connected) return;

        try {
            const singleton = this.getRedis();
            await singleton.connect();
            this.connected = true;
            logger.info("Connected to cache Redis");
        } catch (error) {
            logger.warn(error, "Cache Redis connection failed; continuing without response cache");
            setRuntimeCacheEnabled(false);
        }
    }
}
