import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { _config } from "@/config/config.js";
import { logger } from "@/utils/logger.js";

export const ADMIN_CUSTOM_PRODUCT_SLUG = "admin-custom-booking";

async function findBySlug(): Promise<string | null> {
    const [row] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, ADMIN_CUSTOM_PRODUCT_SLUG))
        .limit(1);
    return row?.id ?? null;
}

async function findById(id: string): Promise<string | null> {
    const [row] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
    return row?.id ?? null;
}

export async function resolveAdminCustomProductId(): Promise<string> {
    const fromEnv = _config.ADMIN_CUSTOM_PRODUCT_ID?.trim();
    if (fromEnv) {
        const found = await findById(fromEnv);
        if (found) return found;
        logger.warn(
            { adminCustomProductId: fromEnv },
            "ADMIN_CUSTOM_PRODUCT_ID is not a catalog product; falling back to admin-custom-booking slug",
        );
    }

    const fromSlug = await findBySlug();
    if (fromSlug) return fromSlug;

    throw ApiError.internalServerError(
        "admin custom product is not configured; run database migrations (creates slug admin-custom-booking) or set ADMIN_CUSTOM_PRODUCT_ID to a real product UUID",
    );
}
