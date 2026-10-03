import { cacheService } from "@/infrastructure/cache/index.js";
import {
    CATALOG_CATEGORIES_PREFIX,
    CATALOG_PRODUCT_DETAIL_PREFIX,
    catalogProductDetailPrefixForProduct,
} from "./catalog-cache.keys.js";

export async function invalidateCategories(): Promise<void> {
    await cacheService.delByPrefix(CATALOG_CATEGORIES_PREFIX);
}

export async function invalidateProductDetail(productId: string): Promise<void> {
    await cacheService.delByPrefix(catalogProductDetailPrefixForProduct(productId));
}

export async function invalidateAllProductDetails(): Promise<void> {
    await cacheService.delByPrefix(CATALOG_PRODUCT_DETAIL_PREFIX);
}
