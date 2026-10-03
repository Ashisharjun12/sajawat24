import { Redis } from "ioredis";
import { logger } from "@/utils/logger.js";
import { IDbProvider } from "../db.interface.js";

export class RedisSingleton implements IDbProvider {
    private static instances = new Map<string, RedisSingleton>();
    private client: Redis;
    private connected = false;

    private constructor(url: string) {
        this.client = new Redis(url, {
            maxRetriesPerRequest: null,
            lazyConnect: true,
        });
    }

    static getInstance(url: string): RedisSingleton {
        if (!RedisSingleton.instances.has(url)) {
            RedisSingleton.instances.set(url, new RedisSingleton(url));
        }
        return RedisSingleton.instances.get(url)!;
    }

    getClient(): Redis {
        return this.client;
    }

    async connect(): Promise<void> {
        if (this.connected) return;

        try {
            await this.client.connect();
            this.connected = true;
            logger.info("Successfully connected to Redis");
        } catch (error) {
            logger.fatal(error, "Redis connection failed");
            process.exit(1);
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected) return;
        await this.client.quit();
        this.connected = false;
        logger.info("Redis disconnected");
    }

    getConnection(): Redis {
        if (!this.connected) {
            throw new Error("Redis not connected");
        }
        return this.client;
    }
}
