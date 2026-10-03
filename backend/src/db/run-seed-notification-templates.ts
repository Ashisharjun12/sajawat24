import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
    NOTIFICATION_TEMPLATE_SEEDS,
    renderNotificationTemplatesSql,
    seedNotificationTemplates,
} from "@/db/seeds/notification-templates.seed.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const args = process.argv.slice(2);
const writeSql = args.includes("--sql");
const outIndex = args.indexOf("--out");
const outPath = outIndex >= 0 ? args[outIndex + 1] : null;

if (writeSql) {
    const sql = renderNotificationTemplatesSql();
    if (outPath) {
        const resolved = path.resolve(outPath);
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        fs.writeFileSync(resolved, sql, "utf8");
        console.log(`Wrote ${NOTIFICATION_TEMPLATE_SEEDS.length} templates to ${resolved}`);
    } else {
        process.stdout.write(sql);
    }
    process.exit(0);
}

const url = process.env.POSTGRES_DATABASE_URL;
if (!url) {
    throw new Error("POSTGRES_DATABASE_URL is missing from .env");
}

const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool);

const result = await seedNotificationTemplates(db);
await pool.end();

console.log(
    `Notification templates seeded: ${result.created} created, ${result.skipped} skipped (${result.total} total)`,
);
