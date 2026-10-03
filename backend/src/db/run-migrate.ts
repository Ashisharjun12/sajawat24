import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const url = process.env.POSTGRES_DATABASE_URL;
if (!url) {
    throw new Error("POSTGRES_DATABASE_URL is missing from .env");
}

const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool);

await migrate(db, { migrationsFolder: path.join(root, "src/db/migrations") });
await pool.end();
console.log("Migrations applied");
