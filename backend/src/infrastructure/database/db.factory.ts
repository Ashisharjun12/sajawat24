import { _config } from "@/config/config.js";
import * as schema from "@/db/schema.js";
import { PostgresPoolSingleton } from "./provider/postgres-pool.singleton.js";
import { PostgresSingleton } from "./provider/postgres.singleton.js";
import { RedisSingleton } from "./provider/redis.singleton.js";

function requireUrl(url: string | undefined, name: string): string {
    if (!url) {
        throw new Error(`${name} is missing from environment — check your .env file`);
    }
    return url;
}

class DbFactory {
    static getMainDatabase() {
        return PostgresSingleton.getInstance(
            requireUrl(_config.POSTGRES_DATABASE_URL, "POSTGRES_DATABASE_URL"),
            schema
        );
    }

    static getAIDatabase() {
        return PostgresPoolSingleton.getInstance(
            requireUrl(_config.AI_DATABASE_URL, "AI_DATABASE_URL"),
        );
    }

    static getRedisDatabase() {
        return RedisSingleton.getInstance(
            requireUrl(_config.REDIS_URL, "REDIS_URL"),
        );
    }

    static async connectAppDatabase(): Promise<void> {
        await DbFactory.getMainDatabase().connect();
        await DbFactory.connectRedis();
    }

    static async connectRedis(): Promise<void> {
        await DbFactory.getRedisDatabase().connect();
    }

    static async connectAI(): Promise<void> {
        await DbFactory.getAIDatabase().connect();
    }
}

export default DbFactory;
