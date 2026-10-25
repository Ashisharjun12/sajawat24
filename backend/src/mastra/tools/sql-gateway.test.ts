import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAnalyticsSql } from "./sql-gateway.js";

test("accepts a simple allowlisted select and wraps limit", () => {
    const { sql } = validateAnalyticsSql(
        "SELECT status, count(*)::int AS n FROM orders GROUP BY status",
    );
    assert.match(sql, /LIMIT 100/);
    assert.match(sql, /FROM orders/i);
});

test("rejects writes", () => {
    assert.throws(
        () => validateAnalyticsSql("DELETE FROM orders"),
        /SELECT or WITH/,
    );
});

test("rejects select star", () => {
    assert.throws(() => validateAnalyticsSql("SELECT * FROM orders"), /SELECT \*/);
});

test("rejects PII columns", () => {
    assert.throws(
        () => validateAnalyticsSql("SELECT customer_phone FROM orders"),
        /blocked/,
    );
});

test("rejects unknown tables", () => {
    assert.throws(
        () => validateAnalyticsSql("SELECT id FROM payment_intents"),
        /allowlist/,
    );
});

test("accepts allowlisted addons select", () => {
    const { sql } = validateAnalyticsSql(
        "SELECT name, price_paise FROM addons WHERE is_active = true",
    );
    assert.match(sql, /FROM addons/i);
    assert.match(sql, /LIMIT 100/);
});

test("rejects addon image upload id", () => {
    assert.throws(
        () => validateAnalyticsSql("SELECT image_upload_id FROM addons"),
        /blocked/,
    );
});

test("rejects uploads and product image tables", () => {
    assert.throws(
        () => validateAnalyticsSql("SELECT key FROM uploads"),
        /allowlist/,
    );
    assert.throws(
        () => validateAnalyticsSql("SELECT upload_id FROM product_images"),
        /allowlist|blocked/,
    );
});
