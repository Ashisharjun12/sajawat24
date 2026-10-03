import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import { slugify } from "@/modules/catalog/slug.js";
import { displayUrl, getCompletedUpload, toPublicMedia, type PublicMedia } from "@/modules/upload/index.js";
import type { IAddonRepository } from "@/modules/catalog/addons/addon.repository.js";
import type { IProductRepository } from "@/modules/catalog/products/product.repository.js";
import {
    invalidateAllProductDetails,
    invalidateProductDetail,
} from "@/modules/catalog/cache/catalog-cache.invalidation.js";
import { normalizeDefaultPaisePair } from "@/modules/catalog/pricing/paise-pair.js";
import type { Addon, AddonColor } from "@/modules/catalog/addons/addon.schema.js";

export type CreateAddonInput = {
    name: string;
    slug?: string;
    description?: string | null;
    imageUploadId?: string | null;
    colorId?: string | null;
    isActive?: boolean;
    pricePaise?: number | null;
    compareAtPaise?: number | null;
    maxQuantity?: number;
};

export type PatchAddonInput = {
    name?: string;
    slug?: string;
    description?: string | null;
    imageUploadId?: string | null;
    colorId?: string | null;
    isActive?: boolean;
    pricePaise?: number | null;
    compareAtPaise?: number | null;
    maxQuantity?: number;
};

export type CreateAddonColorInput = {
    name: string;
    hex: string;
};

export type PatchAddonColorInput = {
    name?: string;
    hex?: string;
};

export type AddonAdmin = Addon & {
    image: (PublicMedia & { url: string }) | null;
    color: Pick<AddonColor, "id" | "name" | "slug" | "hex"> | null;
};

export type AddonAdminListQuery = {
    page?: unknown;
    limit?: unknown;
    q?: unknown;
    isActive?: unknown;
};

export interface IAddonService {
    listAdmin(query: AddonAdminListQuery): Promise<{
        items: AddonAdmin[];
        page: number;
        limit: number;
        total: number;
    }>;
    getAdmin(id: string): Promise<AddonAdmin>;
    create(input: CreateAddonInput): Promise<Addon>;
    patch(id: string, input: PatchAddonInput): Promise<Addon>;
    mapToProduct(productId: string, addonId: string): Promise<{ productId: string; addonId: string }>;
    unmapFromProduct(productId: string, addonId: string): Promise<void>;
    listMappedIds(productId: string): Promise<string[]>;
    listColors(): Promise<AddonColor[]>;
    createColor(input: CreateAddonColorInput): Promise<AddonColor>;
    patchColor(id: string, input: PatchAddonColorInput): Promise<AddonColor>;
}

export class AddonService implements IAddonService {
    constructor(
        private readonly addons: IAddonRepository,
        private readonly products: IProductRepository,
    ) {}

    async listAdmin(query: AddonAdminListQuery) {
        const pagination = parsePagination(query);
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const isActive =
            query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;
        const { items, total } = await this.addons.list(pagination, {
            q: q || undefined,
            isActive,
        });
        const withMedia = await Promise.all(items.map((item) => this.toAdmin(item)));
        return { items: withMedia, page: pagination.page, limit: pagination.limit, total };
    }

    async getAdmin(id: string): Promise<AddonAdmin> {
        const existing = await this.addons.findById(id);
        if (!existing) {
            throw ApiError.notFound("addon not found");
        }
        return this.toAdmin(existing);
    }

    async create(input: CreateAddonInput): Promise<Addon> {
        const name = input.name.trim();
        const slug = slugify(input.slug?.trim() || name);
        if (!slug) {
            throw ApiError.badRequest("invalid addon slug");
        }
        const imageUploadId = await this.assertImage(input.imageUploadId);
        const colorId = await this.assertColor(input.colorId);
        const defaults = normalizeDefaultPaisePair(input.pricePaise, input.compareAtPaise);
        try {
            return await this.addons.insert({
                name,
                slug,
                description: input.description?.trim() || null,
                imageUploadId,
                colorId,
                isActive: input.isActive ?? true,
                pricePaise: defaults.pricePaise,
                compareAtPaise: defaults.compareAtPaise,
                maxQuantity: input.maxQuantity ?? 1,
            });
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("addon slug already exists");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchAddonInput): Promise<Addon> {
        const existing = await this.addons.findById(id);
        if (!existing) {
            throw ApiError.notFound("addon not found");
        }
        const data: Parameters<IAddonRepository["update"]>[1] = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.slug !== undefined) {
            const slug = slugify(input.slug);
            if (!slug) throw ApiError.badRequest("invalid addon slug");
            data.slug = slug;
        } else if (input.name !== undefined) {
            data.slug = slugify(input.name);
        }
        if (input.description !== undefined) {
            data.description = input.description?.trim() || null;
        }
        if (input.imageUploadId !== undefined) {
            data.imageUploadId = await this.assertImage(input.imageUploadId);
        }
        if (input.colorId !== undefined) {
            data.colorId = await this.assertColor(input.colorId);
        }
        if (input.isActive !== undefined) data.isActive = input.isActive;
        if (input.maxQuantity !== undefined) data.maxQuantity = input.maxQuantity;
        if (input.pricePaise !== undefined || input.compareAtPaise !== undefined) {
            const defaults = normalizeDefaultPaisePair(
                input.pricePaise !== undefined ? input.pricePaise : existing.pricePaise,
                input.compareAtPaise !== undefined ? input.compareAtPaise : existing.compareAtPaise,
            );
            data.pricePaise = defaults.pricePaise;
            data.compareAtPaise = defaults.compareAtPaise;
        }
        try {
            const row = await this.addons.update(id, data);
            if (!row) {
                throw ApiError.notFound("addon not found");
            }
            await invalidateAllProductDetails();
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("addon slug already exists");
            }
            throw err;
        }
    }

    async mapToProduct(productId: string, addonId: string) {
        const product = await this.products.findById(productId);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        const addon = await this.addons.findById(addonId);
        if (!addon) {
            throw ApiError.notFound("addon not found");
        }
        await this.addons.map(productId, addonId);
        await invalidateProductDetail(productId);
        return { productId, addonId };
    }

    async unmapFromProduct(productId: string, addonId: string): Promise<void> {
        const product = await this.products.findById(productId);
        if (!product) {
            throw ApiError.notFound("product not found");
        }
        await this.addons.unmap(productId, addonId);
        await invalidateProductDetail(productId);
    }

    listMappedIds(productId: string): Promise<string[]> {
        return this.addons.listMappedIds(productId);
    }

    listColors(): Promise<AddonColor[]> {
        return this.addons.listColors();
    }

    async createColor(input: CreateAddonColorInput): Promise<AddonColor> {
        const trimmed = input.name.trim();
        const slug = slugify(trimmed);
        if (trimmed.length < 2 || !slug) {
            throw ApiError.badRequest("invalid color name");
        }
        const hex = normalizeHex(input.hex);
        try {
            return await this.addons.insertColor({ name: trimmed, slug, hex });
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("color already exists");
            }
            throw err;
        }
    }

    async patchColor(id: string, input: PatchAddonColorInput): Promise<AddonColor> {
        const existing = await this.addons.findColorById(id);
        if (!existing) {
            throw ApiError.notFound("color not found");
        }
        const data: Parameters<IAddonRepository["updateColor"]>[1] = {};
        if (input.name !== undefined) {
            const trimmed = input.name.trim();
            const slug = slugify(trimmed);
            if (trimmed.length < 2 || !slug) {
                throw ApiError.badRequest("invalid color name");
            }
            data.name = trimmed;
            data.slug = slug;
        }
        if (input.hex !== undefined) {
            data.hex = normalizeHex(input.hex);
        }
        try {
            const row = await this.addons.updateColor(id, data);
            if (!row) {
                throw ApiError.notFound("color not found");
            }
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("color already exists");
            }
            throw err;
        }
    }

    private async toAdmin(addon: Addon): Promise<AddonAdmin> {
        let image: AddonAdmin["image"] = null;
        if (addon.imageUploadId) {
            try {
                const upload = await getCompletedUpload(addon.imageUploadId);
                image = { ...toPublicMedia(upload), url: displayUrl(upload) };
            } catch {
                image = null;
            }
        }
        return { ...addon, image, color: await this.toColor(addon.colorId) };
    }

    private async toColor(colorId: string | null): Promise<AddonAdmin["color"]> {
        if (!colorId) return null;
        const row = await this.addons.findColorById(colorId);
        if (!row) return null;
        return { id: row.id, name: row.name, slug: row.slug, hex: row.hex };
    }

    private async assertColor(colorId: string | null | undefined): Promise<string | null> {
        if (!colorId) {
            return null;
        }
        const row = await this.addons.findColorById(colorId);
        if (!row) {
            throw ApiError.notFound("color not found");
        }
        return colorId;
    }

    private async assertImage(imageUploadId: string | null | undefined): Promise<string | null> {
        if (!imageUploadId) {
            return null;
        }
        const upload = await getCompletedUpload(imageUploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("addon image must be an image upload");
        }
        return imageUploadId;
    }
}

function normalizeHex(hex: string): string {
    const value = hex.trim().toLowerCase();
    if (!/^#([0-9a-f]{6})$/.test(value)) {
        throw ApiError.badRequest("invalid hex");
    }
    return value;
}
