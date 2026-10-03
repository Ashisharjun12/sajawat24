import { inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import type { CouponTarget } from "@/modules/promotions/targets/coupon-target.schema.js";
import type { CouponTargetLabel } from "@/modules/promotions/lib/coupon-summary.js";

export async function resolveCouponTargetLabels(
    scope: "entire_cart" | "products" | "categories",
    targets: CouponTarget[],
): Promise<CouponTargetLabel[]> {
    if (scope === "entire_cart" || targets.length === 0) return [];

    const ids = targets.map((t) => t.targetId);
    if (scope === "products") {
        const rows = await db
            .select({ id: products.id, name: products.name })
            .from(products)
            .where(inArray(products.id, ids));
        const byId = new Map(rows.map((r) => [r.id, r.name]));
        return ids.map((id) => ({ id, name: byId.get(id) ?? "Unknown product" }));
    }

    const rows = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(inArray(categories.id, ids));
    const byId = new Map(rows.map((r) => [r.id, r.name]));
    return ids.map((id) => ({ id, name: byId.get(id) ?? "Unknown category" }));
}
