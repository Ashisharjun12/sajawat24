import { Pool } from "pg";
import { logger } from '@/utils/logger.js';

const poolSsl = { rejectUnauthorized: false };

//Pool-only singleton for AI DB 
//  Mastra PostgresStore manages schema via init().
export class PostgresPoolSingleton {
    private static instances = new Map<string, PostgresPoolSingleton>();
    private pool: Pool;
    private connected = false;

    private constructor(connectionString: string) {
        this.pool = new Pool({
            connectionString,
            ssl: poolSsl,
        });
    }

    static getInstance(connectionString: string): PostgresPoolSingleton {
        if (!PostgresPoolSingleton.instances.has(connectionString)) {
            PostgresPoolSingleton.instances.set(
                connectionString,
                new PostgresPoolSingleton(connectionString),
            );
        }
        return PostgresPoolSingleton.instances.get(connectionString)!;
    }

    getPool(): Pool {
        return this.pool;
    }

    async connect(): Promise<void> {
        if (this.connected) return;

        try {
            const client = await this.pool.connect();
            this.connected = true;
            logger.info("Successfully connected to the AI PostgreSQL database");
            client.release();
        } catch (error) {
            logger.fatal(error, "AI PostgreSQL database connection failed");
            process.exit(1);
        }
    }

    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.pool.end();
            this.connected = false;
            logger.info("AI PostgreSQL database disconnected");
        }
    }
}