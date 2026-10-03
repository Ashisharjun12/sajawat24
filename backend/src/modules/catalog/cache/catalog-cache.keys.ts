import { CACHE_KEY_PREFIX } from "@/infrastructure/cache/cache.config.js";

const CATALOG_PREFIX = `${CACHE_KEY_PREFIX}catalog:`;

export const CATALOG_CACHE_TTL = {
    categoriesActiveTreeSeconds: 600,
    productDetailSeconds: 300,
} as const;

export function catalogCategoriesActiveTreeKey(): string {
    return `${CATALOG_PREFIX}categories:active-tree`;
}

export const CATALOG_CATEGORIES_PREFIX = `${CATALOG_PREFIX}categories:`;

export const CATALOG_PRODUCT_DETAIL_PREFIX = `${CATALOG_PREFIX}product-detail:`;

export function catalogProductDetailKey(productId: string, cityId: string): string {
    return `${CATALOG_PRODUCT_DETAIL_PREFIX}${productId}:${cityId}`;
}

export function catalogProductDetailPrefixForProduct(productId: string): string {
    return `${CATALOG_PRODUCT_DETAIL_PREFIX}${productId}:`;
}
