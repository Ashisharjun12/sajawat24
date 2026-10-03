import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

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

const tables = await pool.query(`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public'
`);
const tableCount = tables.rowCount ?? 0;

if (tableCount > 0) {
    console.error(
        `Refusing to reset: public schema has ${tableCount} table(s). Drop data manually if you really want a full reset.`,
    );
    console.error("Tables:", tables.rows.map((r) => r.tablename).join(", "));
    await pool.end();
    process.exit(1);
}

console.log("Clearing orphaned public schema objects (no tables — safe)...");

await pool.query(`CREATE SCHEMA IF NOT EXISTS public`);
await pool.query(`GRANT ALL ON SCHEMA public TO public`);

await pool.query(`
  DO $$
  DECLARE r RECORD;
  BEGIN
    FOR r IN
      SELECT typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    LOOP
      EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
    END LOOP;
  END $$;
`);

await pool.query(`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`);

const enums = await pool.query(`
  SELECT COUNT(*)::int AS n
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e'
`);
console.log(`Remaining public enums: ${enums.rows[0]?.n ?? 0}`);
await pool.end();
console.log("Schema cleared. Run: pnpm db:migrate");
