import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ANALYTICS_MAX_ROWS, executeValidatedSql } from "./sql-gateway.js";
import { ANALYTICS_SCHEMA, KNOWN_METRICS } from "./analytics-schema.js";

export const getSchemaContextTool = createTool({
    id: "get-schema-context",
    description:
        "Return allowlisted analytics tables and columns. Use before writing SQL, or when the user asks what data exists. Does not query business rows.",
    inputSchema: z.object({
        tables: z
            .array(z.string())
            .optional()
            .describe("Optional table names to filter. Omit for the full allowlist."),
    }),
    outputSchema: z.object({
        tables: z.array(
            z.object({
                name: z.string(),
                description: z.string(),
                columns: z.array(
                    z.object({
                        name: z.string(),
                        type: z.string(),
                        description: z.string(),
                    }),
                ),
            }),
        ),
        knownMetrics: z.array(z.object({ id: z.string(), description: z.string() })),
        rules: z.array(z.string()),
    }),
    execute: async (input) => {
        const wanted = input.tables?.map((name) => name.toLowerCase());
        const tables = wanted?.length
            ? ANALYTICS_SCHEMA.filter((table) => wanted.includes(table.name))
            : ANALYTICS_SCHEMA;
        return {
            tables,
            knownMetrics: KNOWN_METRICS.map((metric) => ({
                id: metric.id,
                description: metric.description,
            })),
            rules: [
                "SELECT/WITH only. No SELECT *.",
                `Max ${ANALYTICS_MAX_ROWS} rows. Gateway wraps LIMIT.`,
                "Money columns are paise.",
                "Never select phone, email, address, or password fields.",
                "Prefer get-known-metric for order volume, GMV, top products, catalog, addons, media, and recent_edits (last platform changes).",
                "Product images: catalog_products or top_products. Addon images: catalog_addons. Media library: catalog_media. Last edit on the platform: recent_edits. Never SELECT uploads or product_images.",
                "Only a successful query with zero rows is empty data. A rejected or failed query is an error, not an empty result. Never report it as 'No data'.",
            ],
        };
    },
});

export const executeValidatedSqlTool = createTool({
    id: "execute-validated-sql",
    description:
        "Run one read-only SELECT for a question that no known metric covers. Call get-schema-context first. SQL must list columns, use only allowlisted tables, and never include PII columns. The gateway rejects writes, SELECT *, and unknown tables.",
    inputSchema: z.object({
        sql: z.string().min(12).max(8000).describe("A single SELECT or WITH query"),
        question: z.string().max(400).optional().describe("User question this query answers"),
    }),
    outputSchema: z.object({
        columns: z.array(z.string()),
        rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
        rowCount: z.number(),
        truncated: z.boolean(),
        empty: z.boolean(),
        emptyMessage: z.string().nullable(),
        sqlPreview: z.string(),
    }),
    execute: async (input) => {
        const result = await executeValidatedSql(input.sql);
        const empty = result.rowCount === 0;
        return {
            ...result,
            empty,
            emptyMessage: empty ? "No rows matched this query." : null,
        };
    },
});
