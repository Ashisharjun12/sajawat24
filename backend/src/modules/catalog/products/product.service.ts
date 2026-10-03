import { settingService } from "@/modules/ops/index.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { isForeignKeyViolation, isUniqueViolation } from "@/modules/geo/pg-error.js";
import { getActiveCityById, lookupPincode } from "@/modules/geo/index.js";
import { slugify } from "@/modules/catalog/slug.js";
import { displayUrl, getCompletedUpload, toPublicMedia, type PublicMedia } from "@/modules/upload/index.js";
import type { IMediaRepository } from "@/modules/upload/media/media.repository.js";
import type { Upload } from "@/modules/upload/media/media.schema.js";
import type { ICategoryRepository } from "@/modules/catalog/categories/category.repository.js";
import type { IAddonRepository } from "@/modules/catalog/addons/addon.repository.js";
import type { Category } from "@/modules/catalog/categories/category.schema.js";
import type { ICityPriceRepository } from "@/modules/catalog/pricing/city-price.repository.js";
import {
    normalizeDefaultPaisePair,
    resolvedCompareAtPaise,
    resolvedSellPaise,
} from "@/modules/catalog/pricing/paise-pair.js";
import type { IProductRepository } from "@/modules/catalog/products/product.repository.js";
import { sanitizeFaqs, sanitizePoints } from "@/modules/catalog/products/product-copy.js";
import type { Product, ProductFaq } from "@/modules/catalog/products/product.schema.js";
import type { CityPrice } from "@/modules/catalog/pricing/city-price.schema.js";
import type { PublicCity } from "@/modules/geo/cities/city.public.js";
import type { SiteBrandService } from "@/modules/brand/site-brand.service.js";
import { appendTrustGallerySlide } from "@/modules/catalog/products/product-trust-gallery.js";
import { cacheService } from "@/infrastructure/cache/index.js";
import {
    CATALOG_CACHE_TTL,
    catalogProductDetailKey,
} from "@/modules/catalog/cache/catalog-cache.keys.js";
import { invalidateProductDetail } from "@/modules/catalog/cache/catalog-cache.invalidation.js";
import {
    buildPublicInstantBlock,
    type PublicInstantInfo,
} from "@/modules/catalog/products/product-instant.public.js";

export type ProductImagePublic = PublicMedia & {
    uploadId: string;
    sortIndex: number;
    url: string;
    role?: "trust";
};

export type ProductAdmin = Product & {
    images: ProductImagePublic[];
    addonIds: string[];
    categoryName?: string;
    canPublish?: boolean;
};

export type ProductAdminDetail = ProductAdmin & {
    prices: CityPrice[];
    category: Category | null;
};

export type ProductForCity = Product & {
    pricePaise: number;
    images: ProductImagePublic[];
    addonIds: string[];
    instant: PublicInstantInfo | null;
};

export type PublicAddonForCity = {
    id: string;
    name: string;
    slug: string;
    image: (PublicMedia & { url: string }) | null;
    color: { id: string; name: string; slug: string; hex: string } | null;
    pricePaise: number | null;
    compareAtPaise: number | null;
    maxQuantity: number;
};

export type ProductPublicDetail = ProductForCity & {
    city: PublicCity;
    addons: PublicAddonForCity[];
    instant: PublicInstantInfo | null;
};

export type CreateProductInput = {
    name: string;
    slug?: string;
    description?: string | null;
    categoryId: string;
    isActive?: boolean;
    scheduledEnabled?: boolean;
    instantEnabled?: boolean;
    instantShowBadge?: boolean;
    instantBadgeLabel?: string | null;
    instantPdpNote?: string | null;
    instantEtaMinutes?: number | null;
    paymentCod?: boolean;
    paymentOnline?: boolean;
    imageUploadIds?: string[];
    pricePaise?: number | null;
    compareAtPaise?: number | null;
    includes?: string[];
    deliverySetup?: string[];
    careInstructions?: string[];
    faqs?: ProductFaq[];
};

export type PatchProductInput = {
    name?: string;
    slug?: string;
    description?: string | null;
    categoryId?: string;
    isActive?: boolean;
    scheduledEnabled?: boolean;
    instantEnabled?: boolean;
    instantShowBadge?: boolean;
    instantBadgeLabel?: string | null;
    instantPdpNote?: string | null;
    instantEtaMinutes?: number | null;
    paymentCod?: boolean;
    paymentOnline?: boolean;
    imageUploadIds?: string[];
    pricePaise?: number | null;
    compareAtPaise?: number | null;
    includes?: string[];
    deliverySetup?: string[];
    careInstructions?: string[];
    faqs?: ProductFaq[];
};

export type ProductAdminListQuery = {
    page?: unknown;
    limit?: unknown;
    q?: unknown;
    isActive?: unknown;
    categoryId?: unknown;
    cityId?: unknown;
    price?: unknown;
};

export type PublicProductListQuery = {
    pincode?: unknown;
    cityId?: unknown;
    categoryId?: unknown;
    categoryIds?: unknown;
    minPricePaise?: unknown;
    maxPricePaise?: unknown;
    sort?: unknown;
    q?: unknown;
    instant?: unknown;
    page?: unknown;
    limit?: unknown;
};

function parsePublicSearchQuery(query: PublicProductListQuery): string | undefined {
    const raw = typeof query.q === "string" ? query.q.trim().replace(/[%_\\]/g, "") : "";
    if (!raw || raw.length > 80) return undefined;
    return raw;
}

type PublicProductSort = "popularity" | "new" | "price_asc" | "price_desc";

function parsePublicSort(query: PublicProductListQuery): PublicProductSort {
    const raw = typeof query.sort === "string" ? query.sort.trim() : "";
    if (raw === "new" || raw === "price_asc" || raw === "price_desc" || raw === "popularity") {
        return raw;
    }
    return "popularity";
}

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseCategoryIds(query: PublicProductListQuery): string[] {
    const ids = new Set<string>();
    if (typeof query.categoryId === "string" && UUID_RE.test(query.categoryId)) {
        ids.add(query.categoryId);
    }
    if (typeof query.categoryIds === "string") {
        for (const part of query.categoryIds.split(",")) {
            const id = part.trim();
            if (UUID_RE.test(id)) ids.add(id);
        }
    }
    return [...ids];
}

function parseOptionalPaise(value: unknown): number | undefined {
    if (value == null || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.floor(n);
}

export interface IProductService {
    listAdmin(query: ProductAdminListQuery): Promise<{
        items: ProductAdmin[];
        page: number;
        limit: number;
        total: number;
    }>;
    getAdmin(id: string): Promise<ProductAdminDetail>;
    create(input: CreateProductInput): Promise<ProductAdminDetail>;
    patch(id: string, input: PatchProductInput): Promise<ProductAdminDetail>;
    delete(id: string): Promise<void>;
    listByPincode(query: PublicProductListQuery): Promise<{
        city: PublicCity;
        items: ProductForCity[];
        page: number;
        limit: number;
        total: number;
        facets: {
            categories: { id: string; name: string; count: number }[];
            price: { minPaise: number; maxPaise: number };
        };
    }>;
    getForCity(productId: string, cityId: string): Promise<ProductForCity>;
    getPublicByLocation(
        productId: string,
        query: Pick<PublicProductListQuery, "pincode" | "cityId">,
    ): Promise<ProductPublicDetail>;
    adminByIds(ids: string[]): Promise<ProductAdmin[]>;
    listForCityByIds(cityId: string, productIds: string[]): Promise<ProductForCity[]>;
    findByIds(ids: string[]): Promise<Product[]>;
}

function assertFulfillment(scheduledEnabled: boolean, instantEnabled: boolean) {
    if (!scheduledEnabled && !instantEnabled) {
        throw ApiError.badRequest("product needs scheduled or instant booking");
    }
}

async function assertProductPayment(paymentCod: boolean, paymentOnline: boolean) {
    const platform = await settingService.getPaymentMethods();
    const codOk = paymentCod && platform.cod;
    const onlineOk = paymentOnline && platform.online;
    if (!codOk && !onlineOk) {
        throw ApiError.badRequest("product needs a payment method that is enabled on the platform");
    }
}

export class ProductService implements IProductService {
    constructor(
        private readonly products: IProductRepository,
        private readonly addons: IAddonRepository,
        private readonly prices: ICityPriceRepository,
        private readonly media: IMediaRepository,
        private readonly categories: ICategoryRepository,
        private readonly siteBrand: SiteBrandService,
    ) {}

    async listAdmin(query: ProductAdminListQuery) {
        const pagination = parsePagination(query);
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const isActive =
            query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;
        const categoryId = typeof query.categoryId === "string" ? query.categoryId : undefined;
        const cityId = typeof query.cityId === "string" ? query.cityId : undefined;
        const price =
            query.price === "none" || query.price === "set" || query.price === "sale"
                ? query.price
                : undefined;
        const { items, total } = await this.products.list(pagination, {
            q: q || undefined,
            isActive,
            categoryId,
            cityId,
            price,
        });
        const withMedia = await Promise.all(
            items.map(async (item) => {
                const admin = await this.toAdmin(item);
                const canPublish = await this.isPublishable(item, admin.images);
                return { ...admin, categoryName: item.categoryName, canPublish };
            }),
        );
        return { items: withMedia, page: pagination.page, limit: pagination.limit, total };
    }

    async getAdmin(id: string): Promise<ProductAdminDetail> {
        const product = await this.requireProduct(id);
        const [admin, prices, category] = await Promise.all([
            this.toAdmin(product),
            this.prices.listProductPrices(id),
            this.categories.findById(product.categoryId),
        ]);
        return { ...admin, prices, category: category ?? null };
    }

    async create(input: CreateProductInput): Promise<ProductAdminDetail> {
        await this.assertCategory(input.categoryId);
        const name = input.name.trim();
        const slug = slugify(input.slug?.trim() || name);
        if (!slug) {
            throw ApiError.badRequest("invalid product slug");
        }
        const scheduledEnabled = input.scheduledEnabled ?? true;
        const instantEnabled = input.instantEnabled ?? false;
        const platform = await settingService.getPaymentMethods();
        const paymentCod = input.paymentCod ?? platform.cod;
        const paymentOnline = input.paymentOnline ?? platform.online;
        assertFulfillment(scheduledEnabled, instantEnabled);
        await assertProductPayment(paymentCod, paymentOnline);
        const defaults = normalizeDefaultPaisePair(input.pricePaise, input.compareAtPaise);
        try {
            const row = await this.products.insert({
                name,
                slug,
                description: input.description?.trim() || null,
                categoryId: input.categoryId,
                isActive: false,
                scheduledEnabled,
                instantEnabled,
                instantShowBadge: input.instantShowBadge ?? true,
                instantBadgeLabel: input.instantBadgeLabel?.trim() || null,
                instantPdpNote: input.instantPdpNote?.trim() || null,
                instantEtaMinutes: input.instantEtaMinutes ?? null,
                paymentCod,
                paymentOnline,
                pricePaise: defaults.pricePaise,
                compareAtPaise: defaults.compareAtPaise,
                includes: sanitizePoints(input.includes),
                deliverySetup: sanitizePoints(input.deliverySetup),
                careInstructions: sanitizePoints(input.careInstructions),
                faqs: sanitizeFaqs(input.faqs),
            });
            if (input.imageUploadIds) {
                await this.setImages(row.id, input.imageUploadIds);
            }
            if (input.isActive) {
                await this.assertPublishable(row.id);
                await this.products.update(row.id, { isActive: true });
            }
            const created = await this.getAdmin(row.id);
            await invalidateProductDetail(row.id);
            return created;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("product slug already exists");
            }
            if (isForeignKeyViolation(err)) {
                throw ApiError.badRequest("category not found");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchProductInput): Promise<ProductAdminDetail> {
        const existing = await this.requireProduct(id);
        if (input.categoryId) {
            await this.assertCategory(input.categoryId);
        }
        const data: Parameters<IProductRepository["update"]>[1] = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.slug !== undefined) {
            const slug = slugify(input.slug);
            if (!slug) throw ApiError.badRequest("invalid product slug");
            data.slug = slug;
        } else if (input.name !== undefined) {
            data.slug = slugify(input.name);
        }
        if (input.description !== undefined) {
            data.description = input.description?.trim() || null;
        }
        if (input.categoryId !== undefined) data.categoryId = input.categoryId;
        if (input.isActive === false) data.isActive = false;
        if (input.scheduledEnabled !== undefined) data.scheduledEnabled = input.scheduledEnabled;
        if (input.instantEnabled !== undefined) data.instantEnabled = input.instantEnabled;
        if (input.instantShowBadge !== undefined) data.instantShowBadge = input.instantShowBadge;
        if (input.instantBadgeLabel !== undefined) {
            data.instantBadgeLabel = input.instantBadgeLabel?.trim() || null;
        }
        if (input.instantPdpNote !== undefined) {
            data.instantPdpNote = input.instantPdpNote?.trim() || null;
        }
        if (input.instantEtaMinutes !== undefined) data.instantEtaMinutes = input.instantEtaMinutes;
        if (input.paymentCod !== undefined) data.paymentCod = input.paymentCod;
        if (input.paymentOnline !== undefined) data.paymentOnline = input.paymentOnline;
        if (input.pricePaise !== undefined || input.compareAtPaise !== undefined) {
            const defaults = normalizeDefaultPaisePair(
                input.pricePaise !== undefined ? input.pricePaise : existing.pricePaise,
                input.compareAtPaise !== undefined ? input.compareAtPaise : existing.compareAtPaise,
            );
            data.pricePaise = defaults.pricePaise;
            data.compareAtPaise = defaults.compareAtPaise;
        }
        if (input.includes !== undefined) data.includes = sanitizePoints(input.includes);
        if (input.deliverySetup !== undefined) data.deliverySetup = sanitizePoints(input.deliverySetup);
        if (input.careInstructions !== undefined) {
            data.careInstructions = sanitizePoints(input.careInstructions);
        }
        if (input.faqs !== undefined) data.faqs = sanitizeFaqs(input.faqs);
        const nextScheduled = input.scheduledEnabled ?? existing.scheduledEnabled;
        const nextInstant = input.instantEnabled ?? existing.instantEnabled;
        assertFulfillment(nextScheduled, nextInstant);
        await assertProductPayment(
            input.paymentCod ?? existing.paymentCod,
            input.paymentOnline ?? existing.paymentOnline,
        );
        const nextActive = input.isActive ?? existing.isActive;
        const nextPricePaise =
            input.pricePaise !== undefined ? input.pricePaise : existing.pricePaise;
        try {
            if (Object.keys(data).length > 0) {
                const row = await this.products.update(id, data);
                if (!row) {
                    throw ApiError.notFound("product not found");
                }
            }
            if (input.imageUploadIds) {
                await this.setImages(id, input.imageUploadIds);
            }
            if (nextActive) {
                await this.assertPublishable(id, input.imageUploadIds, nextPricePaise);
            }
            if (input.isActive === true && !existing.isActive) {
                await this.products.update(id, { isActive: true });
            }
            const updated = await this.getAdmin(existing.id);
            await invalidateProductDetail(id);
            return updated;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("product slug already exists");
            }
            if (isForeignKeyViolation(err)) {
                throw ApiError.badRequest("category not found");
            }
            throw err;
        }
    }

    async delete(id: string): Promise<void> {
        await this.requireProduct(id);
        const deleted = await this.products.delete(id);
        if (!deleted) {
            throw ApiError.notFound("product not found");
        }
        await invalidateProductDetail(id);
    }

    async listByPincode(query: PublicProductListQuery) {
        const city = await this.resolvePublicCity(query);
        const categoryIds = parseCategoryIds(query);
        const minPricePaise = parseOptionalPaise(query.minPricePaise);
        const maxPricePaise = parseOptionalPaise(query.maxPricePaise);
        const pagination = parsePagination({
            page: query.page,
            limit: query.limit ?? "24",
        });

        const searchQ = parsePublicSearchQuery(query);
        const filter = {
            categoryIds: categoryIds.length ? categoryIds : undefined,
            minPricePaise,
            maxPricePaise,
            sort: parsePublicSort(query),
            q: searchQ,
            instantOnly: query.instant === "1",
        };

        const [{ items: rows, total }, categories, price] = await Promise.all([
            this.products.listPricedForCityPage(city.id, filter, pagination),
            this.products.listCategoryFacets(city.id, {
                minPricePaise,
                maxPricePaise,
            }),
            this.products.priceRangeForCity(city.id, {
                categoryIds: categoryIds.length ? categoryIds : undefined,
            }),
        ]);

        const items = await Promise.all(
            rows.map(async (row) => this.toCityProduct(row.product, row.pricePaise)),
        );

        return {
            city,
            items,
            page: pagination.page,
            limit: pagination.limit,
            total,
            facets: { categories, price },
        };
    }

    private async resolvePublicCity(query: PublicProductListQuery): Promise<PublicCity> {
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

    async getPublicByLocation(
        productId: string,
        query: Pick<PublicProductListQuery, "pincode" | "cityId">,
    ): Promise<ProductPublicDetail> {
        const city = await this.resolvePublicCity(query);
        const key = catalogProductDetailKey(productId, city.id);
        return cacheService.getOrSet(key, CATALOG_CACHE_TTL.productDetailSeconds, async () => {
            const product = await this.getForCity(productId, city.id);
            const addons = await this.mappedAddonsForCity(product.addonIds, city.id);
            const instant = await buildPublicInstantBlock(product);
            return { ...product, city, addons, instant };
        });
    }

    async adminByIds(ids: string[]): Promise<ProductAdmin[]> {
        const found = await this.products.findByIds(ids);
        const byId = new Map(found.map((row) => [row.id, row]));
        const items: ProductAdmin[] = [];
        for (const id of ids) {
            const product = byId.get(id);
            if (!product) continue;
            items.push(await this.toAdmin(product));
        }
        return items;
    }

    async listForCityByIds(cityId: string, productIds: string[]): Promise<ProductForCity[]> {
        const rows = await this.products.listPricedByIds(cityId, productIds);
        const byId = new Map(rows.map((row) => [row.product.id, row]));
        const pricedIds = productIds.filter((id) => byId.has(id));
        if (pricedIds.length === 0) return [];

        const allImageRows = await this.products.listImagesForProductIds(pricedIds);
        const uploadIds = [...new Set(allImageRows.map((row) => row.uploadId))];
        const uploads = await this.media.findByIds(uploadIds);
        const uploadById = new Map(uploads.map((upload) => [upload.id, upload]));

        const imageRowsByProduct = new Map<string, typeof allImageRows>();
        for (const row of allImageRows) {
            const list = imageRowsByProduct.get(row.productId) ?? [];
            list.push(row);
            imageRowsByProduct.set(row.productId, list);
        }

        const addonIdsByProduct = new Map<string, string[]>();
        await Promise.all(
            pricedIds.map(async (id) => {
                addonIdsByProduct.set(id, await this.addons.listMappedIds(id));
            }),
        );

        const items: ProductForCity[] = [];
        for (const id of productIds) {
            const row = byId.get(id);
            if (!row) continue;
            const baseImages = this.buildProductImages(imageRowsByProduct.get(id) ?? [], uploadById);
            const images = await appendTrustGallerySlide(baseImages, this.siteBrand);
            const instant = await buildPublicInstantBlock(row.product);
            items.push({
                ...row.product,
                pricePaise: row.pricePaise,
                images,
                addonIds: addonIdsByProduct.get(id) ?? [],
                instant,
            });
        }
        return items;
    }

    async findByIds(ids: string[]): Promise<Product[]> {
        return this.products.findByIds(ids);
    }

    async getForCity(productId: string, cityId: string): Promise<ProductForCity> {
        const product = await this.requireProduct(productId);
        if (!product.isActive) {
            throw ApiError.notFound("product not found");
        }
        const override = await this.prices.getProductPrice(productId, cityId);
        const pricePaise = resolvedSellPaise(override?.pricePaise, product.pricePaise);
        if (pricePaise == null) {
            throw ApiError.badRequest("product is not priced for this city");
        }
        return this.toCityProduct(product, pricePaise);
    }

    private async setImages(productId: string, uploadIds: string[]): Promise<void> {
        for (const uploadId of uploadIds) {
            const upload = await getCompletedUpload(uploadId);
            if (upload.kind !== "image" && upload.kind !== "video") {
                throw ApiError.badRequest("product media must be an image or video upload");
            }
        }
        await this.products.replaceImages(productId, uploadIds);
    }

    private buildProductImages(
        rows: { uploadId: string; sortIndex: number }[],
        uploadById: Map<string, Upload>,
    ): ProductImagePublic[] {
        const images: ProductImagePublic[] = [];
        for (const row of rows) {
            const upload = uploadById.get(row.uploadId);
            if (!upload) continue;
            images.push({
                ...toPublicMedia(upload),
                uploadId: row.uploadId,
                sortIndex: row.sortIndex,
                url: displayUrl(upload),
            });
        }
        return images;
    }

    private async imagesFor(productId: string): Promise<ProductImagePublic[]> {
        const rows = await this.products.listImages(productId);
        const uploadIds = rows.map((row) => row.uploadId);
        const uploads = await this.media.findByIds(uploadIds);
        const uploadById = new Map(uploads.map((upload) => [upload.id, upload]));
        return this.buildProductImages(rows, uploadById);
    }

    private async toAdmin(product: Product): Promise<ProductAdmin> {
        const [images, addonIds] = await Promise.all([
            this.imagesFor(product.id),
            this.addons.listMappedIds(product.id),
        ]);
        return { ...product, images, addonIds };
    }

    private async toCityProduct(product: Product, pricePaise: number): Promise<ProductForCity> {
        const admin = await this.toAdmin(product);
        const images = await appendTrustGallerySlide(admin.images, this.siteBrand);
        const instant = await buildPublicInstantBlock(product);
        return { ...admin, pricePaise, images, instant };
    }

    private async mappedAddonsForCity(addonIds: string[], cityId: string): Promise<PublicAddonForCity[]> {
        const items: PublicAddonForCity[] = [];
        for (const addonId of addonIds) {
            const addon = await this.addons.findById(addonId);
            if (!addon || !addon.isActive) continue;
            const override = await this.prices.getAddonPrice(addonId, cityId);
            const pricePaise = resolvedSellPaise(override?.pricePaise, addon.pricePaise);
            const compareAtRaw =
                override?.compareAtPaise != null
                    ? override.compareAtPaise
                    : addon.compareAtPaise ?? null;
            const compareAtPaise = resolvedCompareAtPaise(pricePaise, compareAtRaw);
            items.push({
                id: addon.id,
                name: addon.name,
                slug: addon.slug,
                image: await this.toAddonImage(addon.imageUploadId),
                color: await this.toAddonColor(addon.colorId),
                pricePaise,
                compareAtPaise,
                maxQuantity: addon.maxQuantity ?? 1,
            });
        }
        return items;
    }

    private async toAddonImage(imageUploadId: string | null): Promise<PublicAddonForCity["image"]> {
        if (!imageUploadId) return null;
        try {
            const upload = await getCompletedUpload(imageUploadId);
            return { ...toPublicMedia(upload), url: displayUrl(upload) };
        } catch {
            return null;
        }
    }

    private async toAddonColor(colorId: string | null): Promise<PublicAddonForCity["color"]> {
        if (!colorId) return null;
        const row = await this.addons.findColorById(colorId);
        if (!row) return null;
        return { id: row.id, name: row.name, slug: row.slug, hex: row.hex };
    }

    private async requireProduct(id: string): Promise<Product> {
        const product = await this.products.findById(id);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        return product;
    }

    private async assertCategory(categoryId: string): Promise<void> {
        const category = await this.categories.findById(categoryId);
        if (!category) {
            throw ApiError.notFound("category not found");
        }
    }

    private async isPublishable(product: Product, images: ProductImagePublic[]): Promise<boolean> {
        if (!images.some((item) => item.kind === "image")) return false;
        if (product.pricePaise != null && product.pricePaise > 0) return true;
        const prices = await this.prices.listProductPrices(product.id);
        return prices.length > 0;
    }

    private async assertPublishable(
        productId: string,
        uploadIds?: string[],
        pricePaise?: number | null,
    ): Promise<void> {
        if (uploadIds) {
            const uploads = await Promise.all(uploadIds.map((uploadId) => getCompletedUpload(uploadId)));
            if (!uploads.some((upload) => upload.kind === "image")) {
                throw ApiError.badRequest("product needs at least one image to publish");
            }
        } else {
            const images = await this.imagesFor(productId);
            if (!images.some((item) => item.kind === "image")) {
                throw ApiError.badRequest("product needs at least one image to publish");
            }
        }
        const product = await this.requireProduct(productId);
        const defaultPaise = pricePaise !== undefined ? pricePaise : product.pricePaise;
        if (defaultPaise != null && defaultPaise > 0) return;
        const prices = await this.prices.listProductPrices(productId);
        if (prices.length === 0) {
            throw ApiError.badRequest("product needs a default price to publish");
        }
    }
}
