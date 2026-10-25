import assert from "node:assert/strict";
import { test } from "node:test";
import { queryCatalogProducts, queryProductDetails } from "./analytics-queries.js";

test("queryCatalogProducts returns items with instantLabel and pricing fields", async () => {
    const result = await queryCatalogProducts({ limit: 5 });
    assert.equal(typeof result.empty, "boolean");
    assert.ok(Array.isArray(result.items));
    if (result.items.length > 0) {
        const item = result.items[0];
        assert.ok(item.productId, "item has productId");
        assert.ok(item.productName, "item has productName");
        assert.equal(typeof item.imageUrl, "string");
        assert.equal(typeof item.priceLabel, "string");
        assert.equal(typeof item.instantLabel, "string");
    }
});

test("queryProductDetails returns empty: true for unknown uuid", async () => {
    const result = await queryProductDetails("00000000-0000-4000-8000-000000000000");
    assert.equal(result.empty, true);
    assert.ok(result.emptyMessage);
});

test("queryProductDetails returns full details if catalog has products", async () => {
    const catalog = await queryCatalogProducts({ limit: 1 });
    if (catalog.items.length === 0) return;

    const productId = catalog.items[0].productId;
    const detailRes = await queryProductDetails(productId);
    assert.equal(detailRes.empty, false);
    assert.ok(detailRes.items.length > 0);
    assert.ok(detailRes.detail, "detail object exists");

    const d = detailRes.detail;
    assert.equal(d.id, productId);
    assert.ok(Array.isArray(d.images), "has images array");
    assert.ok(Array.isArray(d.addons), "has addons array");
    assert.ok(Array.isArray(d.cityPrices), "has cityPrices array");
    assert.ok(Array.isArray(d.includes), "has includes array");
    assert.ok(Array.isArray(d.deliverySetup), "has deliverySetup array");
    assert.ok(Array.isArray(d.careInstructions), "has careInstructions array");
    assert.ok(Array.isArray(d.faqs), "has faqs array");
    assert.ok(d.instant, "has instant booking block");
    assert.ok(d.scheduled, "has scheduled booking block");
    assert.ok(d.payments, "has payments block");
});
