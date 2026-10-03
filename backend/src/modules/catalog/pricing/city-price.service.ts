import { ApiError } from "@/shared/errors/apiError.js";
import { isForeignKeyViolation } from "@/modules/geo/pg-error.js";
import type { IAddonRepository } from "@/modules/catalog/addons/addon.repository.js";
import type { IProductRepository } from "@/modules/catalog/products/product.repository.js";
import type { ICityPriceRepository } from "@/modules/catalog/pricing/city-price.repository.js";
import type { AddonCityPrice, CityPrice } from "@/modules/catalog/pricing/city-price.schema.js";
import { assertPaisePair, resolvedSellPaise } from "@/modules/catalog/pricing/paise-pair.js";
import {
    invalidateAllProductDetails,
    invalidateProductDetail,
} from "@/modules/catalog/cache/catalog-cache.invalidation.js";
import {
    type AddonSelection,
    MAX_ADDON_LINE_QTY,
} from "@/modules/catalog/pricing/addon-selection.js";

export type PriceQuote = {
    productId: string;
    cityId: string;
    addonIds: string[];
    productPaise: number;
    addonsPaise: number;
    totalPaise: number;
};

export type CityPriceInput = {
    cityId: string;
    pricePaise: number;
    compareAtPaise?: number | null;
};

export interface ICityPriceService {
    listProductPrices(productId: string): Promise<CityPrice[]>;
    setProductPrice(productId: string, input: CityPriceInput): Promise<CityPrice>;
    deleteProductPrice(productId: string, cityId: string): Promise<void>;
    listAddonPrices(addonId: string): Promise<AddonCityPrice[]>;
    setAddonPrice(addonId: string, input: CityPriceInput): Promise<AddonCityPrice>;
    deleteAddonPrice(addonId: string, cityId: string): Promise<void>;
    quote(productId: string, cityId: string, selections: AddonSelection[]): Promise<PriceQuote>;
}

export class CityPriceService implements ICityPriceService {
    constructor(
        private readonly prices: ICityPriceRepository,
        private readonly products: IProductRepository,
        private readonly addons: IAddonRepository,
    ) {}

    async listProductPrices(productId: string): Promise<CityPrice[]> {
        const product = await this.products.findById(productId);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        return this.prices.listProductPrices(productId);
    }

    async setProductPrice(productId: string, input: CityPriceInput): Promise<CityPrice> {
        const product = await this.products.findById(productId);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        const compareAtPaise = assertPaisePair(input.pricePaise, input.compareAtPaise);
        try {
            const row = await this.prices.upsertProductPrice({
                productId,
                cityId: input.cityId,
                pricePaise: input.pricePaise,
                compareAtPaise,
            });
            await invalidateProductDetail(productId);
            return row;
        } catch (err) {
            if (isForeignKeyViolation(err)) {
                throw ApiError.badRequest("city not found");
            }
            throw err;
        }
    }

    async deleteProductPrice(productId: string, cityId: string): Promise<void> {
        const product = await this.products.findById(productId);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        const deleted = await this.prices.deleteProductPrice(productId, cityId);
        if (!deleted) {
            throw ApiError.notFound("city price not found");
        }
        await invalidateProductDetail(productId);
    }

    async listAddonPrices(addonId: string): Promise<AddonCityPrice[]> {
        const addon = await this.addons.findById(addonId);
        if (!addon) {
            throw ApiError.notFound("addon not found");
        }
        return this.prices.listAddonPrices(addonId);
    }

    async setAddonPrice(addonId: string, input: CityPriceInput): Promise<AddonCityPrice> {
        const addon = await this.addons.findById(addonId);
        if (!addon) {
            throw ApiError.notFound("addon not found");
        }
        const compareAtPaise = assertPaisePair(input.pricePaise, input.compareAtPaise);
        try {
            const row = await this.prices.upsertAddonPrice({
                addonId,
                cityId: input.cityId,
                pricePaise: input.pricePaise,
                compareAtPaise,
            });
            await invalidateAllProductDetails();
            return row;
        } catch (err) {
            if (isForeignKeyViolation(err)) {
                throw ApiError.badRequest("city not found");
            }
            throw err;
        }
    }

    async deleteAddonPrice(addonId: string, cityId: string): Promise<void> {
        const addon = await this.addons.findById(addonId);
        if (!addon) {
            throw ApiError.notFound("addon not found");
        }
        const deleted = await this.prices.deleteAddonPrice(addonId, cityId);
        if (!deleted) {
            throw ApiError.notFound("city price not found");
        }
        await invalidateAllProductDetails();
    }

    async quote(productId: string, cityId: string, selections: AddonSelection[]): Promise<PriceQuote> {
        const product = await this.products.findById(productId);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        const productPrice = await this.prices.getProductPrice(productId, cityId);
        const productPaise = resolvedSellPaise(productPrice?.pricePaise, product.pricePaise);
        if (productPaise == null) {
            throw ApiError.badRequest("product is not priced for this city");
        }
        let addonsPaise = 0;
        const addonIds: string[] = [];
        for (const { addonId, quantity } of selections) {
            if (quantity < 1 || quantity > MAX_ADDON_LINE_QTY) {
                throw ApiError.badRequest("invalid addon quantity");
            }
            const mapped = await this.addons.isMapped(productId, addonId);
            if (!mapped) {
                throw ApiError.badRequest("addon is not mapped to this product");
            }
            const addon = await this.addons.findById(addonId);
            if (!addon) {
                throw ApiError.notFound("addon not found");
            }
            const maxQuantity = addon.maxQuantity ?? 1;
            if (quantity > maxQuantity) {
                throw ApiError.badRequest(`addon "${addon.name}" allows at most ${maxQuantity}`);
            }
            const addonPrice = await this.prices.getAddonPrice(addonId, cityId);
            const addonPaise = resolvedSellPaise(addonPrice?.pricePaise, addon.pricePaise);
            if (addonPaise == null) {
                throw ApiError.badRequest("addon is not priced for this city");
            }
            addonIds.push(addonId);
            addonsPaise += addonPaise * quantity;
        }
        return {
            productId,
            cityId,
            addonIds,
            productPaise,
            addonsPaise,
            totalPaise: productPaise + addonsPaise,
        };
    }
}
