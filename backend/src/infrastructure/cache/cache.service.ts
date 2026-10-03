import type { Redis } from "ioredis";
import { logger } from "@/utils/logger.js";
import { CacheFactory } from "./cache.factory.js";
import { isCacheEnabled } from "./cache.config.js";

export class CacheService {
    private client: Redis | null = null;

    private getClient(): Redis | null {
        if (!isCacheEnabled()) return null;
        try {
            if (!this.client) {
                this.client = CacheFactory.getRedis().getConnection();
            }
            return this.client;
        } catch {
            return null;
        }
    }

    async getJson<T>(key: string): Promise<T | null> {
        const redis = this.getClient();
        if (!redis) return null;
        try {
            const raw = await redis.get(key);
            if (!raw) return null;
            return JSON.parse(raw) as T;
        } catch (error) {
            logger.debug(error, "cache get failed");
            return null;
        }
    }

    async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        const redis = this.getClient();
        if (!redis) return;
        try {
            const payload = JSON.stringify(value);
            if (ttlSeconds > 0) {
                await redis.set(key, payload, "EX", ttlSeconds);
            } else {
                await redis.set(key, payload);
            }
        } catch (error) {
            logger.debug(error, "cache set failed");
        }
    }

    async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
        if (!isCacheEnabled()) {
            return loader();
        }
        const cached = await this.getJson<T>(key);
        if (cached !== null) {
            return cached;
        }
        const fresh = await loader();
        void this.setJson(key, fresh, ttlSeconds);
        return fresh;
    }

    async del(key: string): Promise<void> {
        const redis = this.getClient();
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            logger.debug(error, "cache del failed");
        }
    }

    async delByPrefix(prefix: string): Promise<void> {
        const redis = this.getClient();
        if (!redis) return;
        try {
            let cursor = "0";
            do {
                const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
                cursor = next;
                if (keys.length > 0) {
                    await redis.unlink(...keys);
                }
            } while (cursor !== "0");
        } catch (error) {
            logger.debug(error, "cache delByPrefix failed");
        }
    }
}

export const cacheService = new CacheService();
