import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { logger } from '@/utils/logger.js';
import { IDbProvider } from '../db.interface.js';

const poolSsl = { rejectUnauthorized: false };

export class PostgresSingleton implements IDbProvider {
    private static instances = new Map<string, PostgresSingleton>();
    private pool: Pool;
    public db: ReturnType<typeof drizzle>;
    private connected = false;

    private constructor(connectionString: string, schema: Record<string, unknown>) {
        this.pool = new Pool({
            connectionString,
            ssl: poolSsl,
        });
        this.db = drizzle(this.pool, { schema });
    }

    static getInstance(connectionString: string, schema: Record<string, unknown>): PostgresSingleton {
        if (!PostgresSingleton.instances.has(connectionString)) {
            PostgresSingleton.instances.set(
                connectionString,
                new PostgresSingleton(connectionString,schema),
            );
        }
        return PostgresSingleton.instances.get(connectionString)!;
    }

    getPool(): Pool {
        return this.pool;
    }

    async connect(): Promise<void> {
        if (this.connected) return;

        try {
            const client = await this.pool.connect();
            this.connected = true;
            logger.info("Successfully connected to the PostgreSQL database");
            client.release();
        } catch (error) {
            logger.fatal(error, "PostgreSQL Database connection failed");
            process.exit(1);
        }
    }

    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.pool.end();
            this.connected = false;
            logger.info("PostgreSQL database disconnected");
        }
    }

    getConnection() {
        if (!this.connected) {
            throw new Error("PostgreSQL not connected");
        }
        return this.db;
    }
}