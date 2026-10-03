/**
 * When the DB schema already exists but the current `0000_*.sql` journal entry
 * was never recorded in Drizzle's migration table (common after squash/regenerate).
 * Inserts the initial migration hash into `drizzle.__drizzle_migrations` so
 * `pnpm db:migrate` only applies newer files (e.g. 0001_addon_max_quantity).
 */
import { config } from "dotenv";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const url = process.env.POSTGRES_DATABASE_URL;
if (!url) {
    throw new Error("POSTGRES_DATABASE_URL is missing from .env");
}

const migrationsFolder = path.join(root, "src/db/migrations");
const journal = JSON.parse(
    fs.readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf8"),
) as { entries: { tag: string; when: number }[] };

const initial = journal.entries[0];
if (!initial) {
    throw new Error("no migrations in journal");
}

const initialSql = fs.readFileSync(path.join(migrationsFolder, `${initial.tag}.sql`), "utf8");
const initialHash = crypto.createHash("sha256").update(initialSql).digest("hex");

const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
});

const typeCheck = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'user_role'
    ) AS exists`,
);

if (!typeCheck.rows[0]?.exists) {
    console.log("Fresh database detected — run pnpm db:migrate (no baseline needed).");
    await pool.end();
    process.exit(0);
}

await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
await pool.query(`
    CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
    )
`);

const applied = await pool.query<{ hash: string }>(
    `SELECT hash FROM drizzle."__drizzle_migrations"`,
);
const hasInitial = applied.rows.some((row) => row.hash === initialHash);

if (!hasInitial) {
    await pool.query(
        `INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
        [initialHash, initial.when],
    );
    console.log(`Baselined migration: ${initial.tag}`);
} else {
    console.log(`Migration ${initial.tag} already recorded in drizzle.__drizzle_migrations.`);
}

await pool.end();
console.log("Done. Run: pnpm db:migrate");
