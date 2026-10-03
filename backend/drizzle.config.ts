import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(root, ".env") });

const databaseUrl = process.env.POSTGRES_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("POSTGRES_DATABASE_URL is missing from .env — cannot run drizzle-kit");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
  },
});