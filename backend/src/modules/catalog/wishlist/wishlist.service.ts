import { getActiveCityById, lookupPincode } from "@/modules/geo/index.js";
import type { IProductService, ProductForCity } from "@/modules/catalog/products/product.service.js";
import { WISHLIST_MAX_ITEMS } from "@/modules/catalog/wishlist/wishlist.dto.js";
import type { IWishlistRepository } from "@/modules/catalog/wishlist/wishlist.repository.js";
import type {
    WishlistItemPublic,
    WishlistListResponse,
    WishlistProductCard,
} from "@/modules/catalog/wishlist/wishlist.public.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { resolvedCompareAtPaise } from "@/modules/catalog/pricing/paise-pair.js";

export type WishlistLocationQuery = {
    pincode?: string;
    cityId?: string;
};

export interface IWishlistService {
    list(userId: string, query: WishlistLocationQuery): Promise<WishlistListResponse>;
    add(userId: string, productId: string, query: WishlistLocationQuery): Promise<WishlistListResponse>;
    remove(userId: string, productId: string, query: WishlistLocationQuery): Promise<WishlistListResponse>;
    merge(
        userId: string,
        productIds: string[],
        query: WishlistLocationQuery,
    ): Promise<WishlistListResponse>;
}

function toCard(product: ProductForCity): WishlistProductCard {
    return {
        id: product.id,
        name: product.name,
        title: product.name,
        slug: product.slug,
        pricePaise: product.pricePaise,
        compareAtPaise: resolvedCompareAtPaise(product.pricePaise, product.compareAtPaise),
        imageUrl: product.images[0]?.url ?? null,
        ratingAvg: product.ratingAvg,
        reviewCount: product.reviewCount,
        instant: product.instant,
    };
}

export class WishlistService implements IWishlistService {
    constructor(
        private readonly wishlist: IWishlistRepository,
        private readonly products: IProductService,
    ) {}

    async list(userId: string, query: WishlistLocationQuery): Promise<WishlistListResponse> {
        const rows = await this.wishlist.listByUserId(userId);
        const items = await this.hydrateRows(rows, query);
        return {
            items,
            meta: { total: items.length },
        };
    }

    async add(userId: string, productId: string, query: WishlistLocationQuery): Promise<WishlistListResponse> {
        const product = await this.products.findByIds([productId]);
        if (product.length === 0) {
            throw ApiError.notFound("product not found");
        }
        const existing = await this.wishlist.findByUserAndProduct(userId, productId);
        if (!existing) {
            const count = await this.wishlist.countByUserId(userId);
            if (count >= WISHLIST_MAX_ITEMS) {
                throw ApiError.conflict(`wishlist limit is ${WISHLIST_MAX_ITEMS} items`);
            }
            await this.wishlist.insert({ userId, productId });
        }
        return this.list(userId, query);
    }

    async remove(userId: string, productId: string, query: WishlistLocationQuery): Promise<WishlistListResponse> {
        await this.wishlist.deleteByUserAndProduct(userId, productId);
        return this.list(userId, query);
    }

    async merge(
        userId: string,
        productIds: string[],
        query: WishlistLocationQuery,
    ): Promise<WishlistListResponse> {
        const uniqueIncoming = [...new Set(productIds)];
        if (uniqueIncoming.length > 0) {
            const existingProducts = await this.products.findByIds(uniqueIncoming);
            const validIds = new Set(existingProducts.map((p) => p.id));
            for (const productId of uniqueIncoming) {
                if (!validIds.has(productId)) continue;
                await this.wishlist.insertIgnore(userId, productId);
            }
        }
        await this.trimToMax(userId);
        const response = await this.list(userId, query);
        return {
            ...response,
            meta: {
                total: response.meta.total,
                capped: response.meta.total >= WISHLIST_MAX_ITEMS,
            },
        };
    }

    private async trimToMax(userId: string): Promise<void> {
        const count = await this.wishlist.countByUserId(userId);
        if (count <= WISHLIST_MAX_ITEMS) return;
        const oldest = await this.wishlist.listOldestByUserId(userId);
        const excess = oldest.length - WISHLIST_MAX_ITEMS;
        const toRemove = oldest.slice(0, excess).map((row) => row.id);
        await this.wishlist.deleteByIds(toRemove);
    }

    private async resolveCity(query: WishlistLocationQuery) {
        const cityId = typeof query.cityId === "string" ? query.cityId.trim() : "";
        const pincode = typeof query.pincode === "string" ? query.pincode.trim() : "";
        if (cityId) {
            const city = await getActiveCityById(cityId);
            if (pincode) {
                const lookup = await lookupPincode(pincode, city.id);
                if (!lookup.deliverable) {
                    throw ApiError.badRequest("pincode not serviceable");
                }
            }
            return city;
        }
        if (pincode) {
            const lookup = await lookupPincode(pincode);
            if (!lookup.deliverable || !lookup.city) {
                throw ApiError.badRequest("pincode not serviceable");
            }
            return lookup.city;
        }
        throw ApiError.badRequest("pincode or cityId is required");
    }

    private async hydrateRows(
        rows: { productId: string; createdAt: Date }[],
        query: WishlistLocationQuery,
    ): Promise<WishlistItemPublic[]> {
        if (rows.length === 0) return [];

        const city = await this.resolveCity(query);
        const productIds = rows.map((row) => row.productId);
        const priced = await this.products.listForCityByIds(city.id, productIds);
        const pricedById = new Map(priced.map((p) => [p.id, p]));
        const allProducts = await this.products.findByIds(productIds);
        const productById = new Map(allProducts.map((p) => [p.id, p]));

        return rows.map((row) => {
            const addedAt = row.createdAt.toISOString();
            const pricedProduct = pricedById.get(row.productId);
            if (pricedProduct) {
                return {
                    productId: row.productId,
                    addedAt,
                    available: true,
                    product: toCard(pricedProduct),
                };
            }
            const raw = productById.get(row.productId);
            if (!raw) {
                return {
                    productId: row.productId,
                    addedAt,
                    available: false,
                    unavailableReason: "inactive",
                };
            }
            if (!raw.isActive) {
                return {
                    productId: row.productId,
                    addedAt,
                    available: false,
                    unavailableReason: "inactive",
                };
            }
            const reason =
                raw.pricePaise == null && priced.length === 0 ? "no_price" : "not_in_city";
            return {
                productId: row.productId,
                addedAt,
                available: false,
                unavailableReason: reason,
            };
        });
    }
}
