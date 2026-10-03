import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import { slugify } from "@/modules/catalog/slug.js";
import {
    displayUrl,
    getCompletedUpload,
    resolveCompletedUploads,
    toPublicMedia,
    type PublicMedia,
} from "@/modules/upload/index.js";
import { cacheService } from "@/infrastructure/cache/index.js";
import {
    CATALOG_CACHE_TTL,
    catalogCategoriesActiveTreeKey,
} from "@/modules/catalog/cache/catalog-cache.keys.js";
import { invalidateCategories as invalidateCategoriesCache } from "@/modules/catalog/cache/catalog-cache.invalidation.js";
import { invalidateHome } from "@/modules/cms/cache/cms-cache.invalidation.js";
import type { ICategoryRepository } from "@/modules/catalog/categories/category.repository.js";
import type { Category } from "@/modules/catalog/categories/category.schema.js";
import type { Upload } from "@/modules/upload/media/media.schema.js";

export type CategoryImage = (PublicMedia & { url: string }) | null;

export type CategoryAdmin = Category & { image: CategoryImage };

export type CategoryTree = CategoryAdmin & { children: CategoryAdmin[] };

export type CreateCategoryInput = {
    name: string;
    slug?: string;
    parentId?: string | null;
    imageUploadId?: string | null;
    iconKey?: string | null;
    iconTone?: string | null;
    isActive?: boolean;
};

export type PatchCategoryInput = {
    name?: string;
    slug?: string;
    parentId?: string | null;
    imageUploadId?: string | null;
    iconKey?: string | null;
    iconTone?: string | null;
    isActive?: boolean;
};

export type CategoryAdminListQuery = {
    page?: unknown;
    limit?: unknown;
    q?: unknown;
    isActive?: unknown;
    parentId?: unknown;
};

export interface ICategoryService {
    listActiveTree(): Promise<CategoryTree[]>;
    listActiveTreeCached(): Promise<CategoryTree[]>;
    listAdmin(query: CategoryAdminListQuery): Promise<{
        items: CategoryAdmin[];
        page: number;
        limit: number;
        total: number;
    }>;
    create(input: CreateCategoryInput): Promise<CategoryAdmin>;
    patch(id: string, input: PatchCategoryInput): Promise<CategoryAdmin>;
}

export class CategoryService implements ICategoryService {
    constructor(private readonly categories: ICategoryRepository) {}

    async listActiveTreeCached(): Promise<CategoryTree[]> {
        const key = catalogCategoriesActiveTreeKey();
        return cacheService.getOrSet(key, CATALOG_CACHE_TTL.categoriesActiveTreeSeconds, () =>
            this.listActiveTree(),
        );
    }

    async listActiveTree(): Promise<CategoryTree[]> {
        const rows = await this.categories.listActive();
        const uploadIds = rows.map((row) => row.imageUploadId).filter(Boolean) as string[];
        const uploadMap = await resolveCompletedUploads(uploadIds);
        const withMedia = rows.map((row) => this.toAdminWithUploadMap(row, uploadMap));
        const childrenByParent = new Map<string, CategoryAdmin[]>();
        const tops: CategoryAdmin[] = [];
        for (const row of withMedia) {
            if (!row.parentId) {
                tops.push(row);
                continue;
            }
            const list = childrenByParent.get(row.parentId) ?? [];
            list.push(row);
            childrenByParent.set(row.parentId, list);
        }
        return tops.map((parent) => ({
            ...parent,
            children: childrenByParent.get(parent.id) ?? [],
        }));
    }

    async listAdmin(query: CategoryAdminListQuery) {
        const pagination = parsePagination(query);
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const isActive =
            query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;
        const parentRaw = typeof query.parentId === "string" ? query.parentId : undefined;
        const parentId =
            parentRaw === undefined
                ? undefined
                : parentRaw === "null" || parentRaw === ""
                  ? null
                  : parentRaw;
        const { items, total } = await this.categories.list(pagination, {
            q: q || undefined,
            isActive,
            parentId,
        });
        const withMedia = await Promise.all(items.map((item) => this.toAdmin(item)));
        return { items: withMedia, page: pagination.page, limit: pagination.limit, total };
    }

    async create(input: CreateCategoryInput): Promise<CategoryAdmin> {
        const name = input.name.trim();
        const slug = slugify(input.slug?.trim() || name);
        if (!slug) {
            throw ApiError.badRequest("invalid category slug");
        }
        const parentId = input.parentId ?? null;
        if (parentId) {
            await this.assertTopLevelParent(parentId);
        }
        const imageUploadId = await this.assertImage(input.imageUploadId);
        try {
            const row = await this.categories.insert({
                name,
                slug,
                parentId,
                imageUploadId,
                iconKey: parentId ? null : (input.iconKey ?? "sparkles"),
                iconTone: parentId ? null : (input.iconTone ?? "amber"),
                isActive: input.isActive ?? true,
            });
            const created = await this.toAdmin(row);
            await invalidateCategoriesCache();
            await invalidateHome();
            return created;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("category slug already exists");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchCategoryInput): Promise<CategoryAdmin> {
        const existing = await this.categories.findById(id);
        if (!existing) {
            throw ApiError.notFound("category not found");
        }
        const data: Parameters<ICategoryRepository["update"]>[1] = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.slug !== undefined) {
            const slug = slugify(input.slug);
            if (!slug) throw ApiError.badRequest("invalid category slug");
            data.slug = slug;
        } else if (input.name !== undefined) {
            data.slug = slugify(input.name);
        }
        if (input.parentId !== undefined) {
            if (input.parentId === id) {
                throw ApiError.badRequest("category cannot parent itself");
            }
            if (input.parentId) {
                await this.assertTopLevelParent(input.parentId);
            }
            data.parentId = input.parentId;
        }
        if (input.imageUploadId !== undefined) {
            data.imageUploadId = await this.assertImage(input.imageUploadId);
        }
        if (input.iconKey !== undefined) {
            data.iconKey = existing.parentId ? null : input.iconKey;
        }
        if (input.iconTone !== undefined) {
            data.iconTone = existing.parentId ? null : input.iconTone;
        }
        if (input.isActive !== undefined) data.isActive = input.isActive;
        try {
            const row = await this.categories.update(id, data);
            if (!row) {
                throw ApiError.notFound("category not found");
            }
            const updated = await this.toAdmin(row);
            await invalidateCategoriesCache();
            await invalidateHome();
            return updated;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("category slug already exists");
            }
            throw err;
        }
    }

    private async assertTopLevelParent(parentId: string): Promise<void> {
        const parent = await this.categories.findById(parentId);
        if (!parent) {
            throw ApiError.notFound("parent category not found");
        }
        if (parent.parentId) {
            throw ApiError.badRequest("parent must be a top-level category");
        }
    }

    private async assertImage(imageUploadId: string | null | undefined): Promise<string | null> {
        if (!imageUploadId) {
            return null;
        }
        const upload = await getCompletedUpload(imageUploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("category image must be an image upload");
        }
        return imageUploadId;
    }

    private toAdminWithUploadMap(
        row: Category,
        uploadMap: Map<string, Upload>,
    ): CategoryAdmin {
        return { ...row, image: this.toImageFromUploadMap(row.imageUploadId, uploadMap) };
    }

    private async toAdmin(row: Category): Promise<CategoryAdmin> {
        return { ...row, image: await this.toImage(row.imageUploadId) };
    }

    private toImageFromUploadMap(
        imageUploadId: string | null,
        uploadMap: Map<string, Upload>,
    ): CategoryImage {
        if (!imageUploadId) return null;
        const upload = uploadMap.get(imageUploadId);
        if (!upload) return null;
        return { ...toPublicMedia(upload), url: displayUrl(upload) };
    }

    private async toImage(imageUploadId: string | null): Promise<CategoryImage> {
        if (!imageUploadId) return null;
        try {
            const upload = await getCompletedUpload(imageUploadId);
            return { ...toPublicMedia(upload), url: displayUrl(upload) };
        } catch {
            return null;
        }
    }
}
