import DbFactory from "@/infrastructure/database/db.factory.js";
import { ANALYTICS_TABLES, BLOCKED_IDENTIFIERS } from "./analytics-schema.js";

export const ANALYTICS_MAX_ROWS = 100;
export const ANALYTICS_STATEMENT_TIMEOUT_MS = 5_000;

const FORBIDDEN = [
    /\b(insert|update|delete|drop|alter|truncate|grant|revoke|copy|create|comment|vacuum|analyze|refresh|reindex|cluster|lock|notify|listen|unlisten|do|call|execute|prepare|deallocate|discard|load|reset)\b/i,
    /\bpg_(sleep|read_file|write_file|ls_dir|stat_file)\b/i,
    /\bdblink\b/i,
    /\blo_(import|export|get)\b/i,
    /\bset\s+(role|session)\b/i,
    /\binto\s+(outfile|dumpfile)\b/i,
    /\binformation_schema\b/i,
    /\bpg_catalog\b/i,
];

function stripSqlLiterals(sql: string): string {
    return sql
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/--[^\n]*/g, " ")
        .replace(/'(?:''|[^'])*'/g, "''")
        .replace(/\$\$[\s\S]*?\$\$/g, " ");
}

function normalizeSql(sql: string): string {
    return sql.trim().replace(/;+\s*$/g, "").trim();
}

function extractRelations(stripped: string): string[] {
    const names = new Set<string>();
    const re =
        /\b(?:from|join)\s+(?:only\s+)?(?:"?([a-zA-Z_][\w]*)"?\.)?"?([a-zA-Z_][\w]*)"?/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(stripped))) {
        const schema = match[1]?.toLowerCase();
        const table = match[2]?.toLowerCase();
        if (schema && schema !== "public") {
            names.add(`${schema}.${table}`);
        } else {
            names.add(table);
        }
    }
    return [...names];
}

function extractIdentifiers(stripped: string): string[] {
    const found = new Set<string>();
    const re = /"?([a-zA-Z_][\w]*)"?/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(stripped))) {
        found.add(match[1].toLowerCase());
    }
    return [...found];
}

export function validateAnalyticsSql(raw: string): { sql: string } {
    if (!raw || typeof raw !== "string") {
        throw new Error("SQL is required.");
    }
    const sql = normalizeSql(raw);
    if (!sql) {
        throw new Error("SQL is empty.");
    }
    if (sql.length > 8_000) {
        throw new Error("SQL is too long.");
    }
    const stripped = stripSqlLiterals(sql);
    if (stripped.includes(";")) {
        throw new Error("Only one SQL statement is allowed.");
    }
    if (!/^\s*(with|select)\b/i.test(stripped)) {
        throw new Error("Only SELECT or WITH (CTE) queries are allowed.");
    }
    const withoutCountStar = stripped.replace(/\bcount\s*\(\s*\*\s*\)/gi, "count(1)");
    if (/\bselect\s+\*|[\w"]\.\s*\*/i.test(withoutCountStar)) {
        throw new Error("SELECT * is not allowed. List allowed columns explicitly.");
    }
    for (const pattern of FORBIDDEN) {
        if (pattern.test(stripped)) {
            throw new Error("SQL contains a forbidden keyword or function.");
        }
    }

    const relations = extractRelations(stripped);
    if (relations.length === 0) {
        throw new Error("Query must read from an allowlisted table.");
    }
    for (const relation of relations) {
        const table = relation.includes(".") ? relation.split(".")[1] : relation;
        if (relation.includes(".") && !relation.startsWith("public.")) {
            throw new Error(`Table ${relation} is not allowed.`);
        }
        if (!ANALYTICS_TABLES.has(table)) {
            throw new Error(`Table ${table} is not in the analytics allowlist.`);
        }
    }

    for (const ident of extractIdentifiers(stripped)) {
        if (BLOCKED_IDENTIFIERS.has(ident)) {
            throw new Error(`Column ${ident} is blocked (PII or secret).`);
        }
    }

    const wrapped = `SELECT * FROM (\n${sql}\n) AS analytics_q LIMIT ${ANALYTICS_MAX_ROWS}`;
    return { sql: wrapped };
}

function serializeCell(value: unknown): string | number | boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "bigint") return Number(value);
    const text = String(value);
    return text.length > 240 ? `${text.slice(0, 237)}...` : text;
}

export async function executeValidatedSql(rawSql: string): Promise<{
    columns: string[];
    rows: Array<Array<string | number | boolean | null>>;
    rowCount: number;
    truncated: boolean;
    sqlPreview: string;
}> {
    const { sql } = validateAnalyticsSql(rawSql);
    const pool = DbFactory.getMainDatabase().getPool();
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`SET LOCAL statement_timeout = ${ANALYTICS_STATEMENT_TIMEOUT_MS}`);
        const result = await client.query(sql);
        await client.query("COMMIT");
        const columns = result.fields.map((field) => field.name);
        const rows = result.rows.map((row) =>
            columns.map((col) => serializeCell((row as Record<string, unknown>)[col])),
        );
        return {
            columns,
            rows,
            rowCount: rows.length,
            truncated: rows.length >= ANALYTICS_MAX_ROWS,
            sqlPreview: rawSql.trim().slice(0, 500),
        };
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            /* ignore */
        }
        const message = error instanceof Error ? error.message : "Query failed";
        throw new Error(message.replace(/password|secret|connection string/gi, "[redacted]"));
    } finally {
        client.release();
    }
}
