import { ApiError } from "@/shared/errors/apiError.js";
import { getActiveCityById, lookupPincode } from "@/modules/geo/index.js";
import type { ICategoryService, CategoryAdmin } from "@/modules/catalog/categories/category.service.js";
import type { ICategoryRepository } from "@/modules/catalog/categories/category.repository.js";
import type { ISectionService } from "@/modules/catalog/sections/section.service.js";
import type { ISectionRepository } from "@/modules/catalog/sections/section.repository.js";
import type { ProductForCity } from "@/modules/catalog/products/product.service.js";
import type { CmsHomeLayoutRepository } from "@/modules/cms/home-layout/home-layout.repository.js";
import type {
    CategoryRowConfig,
    CmsHomeLayoutBlock,
} from "@/modules/cms/home-layout/home-layout.schema.js";
import type { z } from "zod";
import type {
    createHomeLayoutBlockDto,
    patchHomeLayoutBlockDto,
} from "@/modules/cms/home-layout/home-layout.dto.js";
import { invalidateHome } from "@/modules/cms/cache/cms-cache.invalidation.js";
import { matchesCmsHomeLayoutPlatform } from "@/modules/cms/cms-platforms.js";

type CreateInput = z.infer<typeof createHomeLayoutBlockDto>;
type PatchInput = z.infer<typeof patchHomeLayoutBlockDto>;

export type PublicLayoutCategory = {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    iconKey: string | null;
    iconTone: string | null;
    imageUrl: string | null;
    children: PublicLayoutCategory[];
};

export type PublicCategoryRowBlock = {
    type: "category_row";
    id: string;
    title: string | null;
    subtitle: string | null;
    showTitle: boolean;
    showSubtitle: boolean;
    maxVisible: number;
    showViewAll: boolean;
    viewAllHref: string;
    enableDrillDown: boolean;
    categories: PublicLayoutCategory[];
};

export type PublicProductRailBlock = {
    type: "product_rail";
    id: string;
    title: string | null;
    subtitle: string | null;
    showTitle: boolean;
    showSubtitle: boolean;
    sectionSlug: string | null;
    sectionName: string;
    sectionBadgeColor: string;
    items: ProductForCity[];
};

export type PublicLayoutBlock = PublicCategoryRowBlock | PublicProductRailBlock;

function isPublished(row: { status: string; startsAt?: Date | null; endsAt?: Date | null }, at = new Date()) {
    if (row.status !== "published") return false;
    if (row.startsAt && row.startsAt > at) return false;
    if (row.endsAt && row.endsAt < at) return false;
    return true;
}

function normalizeCategoryRowConfig(config: CategoryRowConfig | null | undefined): CategoryRowConfig {
    return {
        maxVisible: config?.maxVisible ?? 5,
        showViewAll: config?.showViewAll ?? true,
        viewAllHref: config?.viewAllHref ?? null,
        enableDrillDown: config?.enableDrillDown ?? false,
    };
}

export class CmsHomeLayoutService {
    constructor(
        private readonly blocks: CmsHomeLayoutRepository,
        private readonly sections: ISectionService,
        private readonly sectionRepo: ISectionRepository,
        private readonly categories: ICategoryService,
        private readonly categoryRepo: ICategoryRepository,
    ) {}

    async listAdmin(query: { cityId?: string | null; status?: CmsHomeLayoutBlock["status"] }) {
        const items = await this.blocks.listAdmin({
            cityId: query.cityId,
            status: query.status,
        });
        const withCategories = await Promise.all(
            items.map(async (row) => ({
                ...row,
                categoryIds: row.type === "category_row"
                    ? (await this.blocks.listBlockCategories(row.id)).map((c) => c.categoryId)
                    : [],
            })),
        );
        return { items: withCategories };
    }

    async getAdmin(id: string) {
        const row = await this.blocks.findByIdWithCity(id);
        if (!row) throw ApiError.notFound("Home layout block not found");
        const categoryIds =
            row.type === "category_row"
                ? (await this.blocks.listBlockCategories(row.id)).map((c) => c.categoryId)
                : [];
        return { ...row, categoryIds };
    }

    async create(input: CreateInput) {
        if (input.status === "published" && input.type === "category_row" && !input.categoryIds?.length) {
            throw ApiError.badRequest("category row needs at least one category to publish");
        }
        await this.validateBlock(input);
        const cityId = input.cityId ?? null;
        const sortIndex = input.sortIndex ?? await this.blocks.nextSortIndex(cityId);
        const config = input.type === "category_row" ? normalizeCategoryRowConfig(input.config) : {};
        const row = await this.blocks.insert({
            type: input.type,
            cityId,
            status: input.status,
            sortIndex,
            platforms: input.platforms,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            title: input.title ?? null,
            subtitle: input.subtitle ?? null,
            showTitle: input.showTitle ?? true,
            showSubtitle: input.showSubtitle ?? true,
            sectionId: input.type === "product_rail" ? input.sectionId : null,
            config,
        });
        if (input.type === "category_row" && input.categoryIds?.length) {
            await this.assertCategories(input.categoryIds);
            await this.blocks.replaceBlockCategories(row.id, input.categoryIds);
        }
        const created = await this.getAdmin(row.id);
        await invalidateHome();
        return created;
    }

    async patch(id: string, input: PatchInput) {
        const existing = await this.blocks.findById(id);
        if (!existing) throw ApiError.notFound("Home layout block not found");
        const nextType = existing.type;
        const merged = {
            type: nextType,
            sectionId:
                input.sectionId !== undefined
                    ? input.sectionId
                    : existing.sectionId,
            categoryIds: input.categoryIds,
            config: input.config !== undefined ? input.config : existing.config,
            status: input.status ?? existing.status,
        };
        const categoryIdsForValidate =
            input.categoryIds ??
            (nextType === "category_row"
                ? (await this.blocks.listBlockCategories(id)).map((c) => c.categoryId)
                : []);
        await this.validateBlock({
            ...merged,
            type: nextType,
            platforms: input.platforms ?? existing.platforms,
            sectionId: nextType === "product_rail" ? merged.sectionId : null,
            categoryIds: categoryIdsForValidate,
            status: input.status ?? existing.status,
        } as CreateInput);
        if (
            (input.status === "published" || (input.status === undefined && existing.status === "published")) &&
            nextType === "category_row" &&
            categoryIdsForValidate.length === 0
        ) {
            throw ApiError.badRequest("category row needs at least one category to publish");
        }

        if (nextType === "product_rail" && input.sectionId !== undefined) {
            if (!input.sectionId) {
                throw ApiError.badRequest("product rail requires section");
            }
        }

        const config =
            nextType === "category_row"
                ? normalizeCategoryRowConfig(
                      input.config !== undefined ? input.config : (existing.config as CategoryRowConfig),
                  )
                : existing.config;

        const row = await this.blocks.update(id, {
            cityId: input.cityId,
            status: input.status,
            sortIndex: input.sortIndex,
            platforms: input.platforms,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            title: input.title,
            subtitle: input.subtitle,
            showTitle: input.showTitle,
            showSubtitle: input.showSubtitle,
            sectionId: nextType === "product_rail" ? merged.sectionId : null,
            config,
        });
        if (!row) throw ApiError.notFound("Home layout block not found");

        if (input.categoryIds !== undefined && nextType === "category_row") {
            await this.assertCategories(input.categoryIds);
            await this.blocks.replaceBlockCategories(id, input.categoryIds);
        }

        const updated = await this.getAdmin(id);
        await invalidateHome();
        return updated;
    }

    async delete(id: string) {
        const deleted = await this.blocks.delete(id);
        if (!deleted) throw ApiError.notFound("Home layout block not found");
        await invalidateHome();
        return { id };
    }

    async reorder(cityId: string | null, ids: string[]) {
        try {
            await this.blocks.reorder(cityId, ids);
        } catch {
            throw ApiError.badRequest("Invalid home layout reorder payload");
        }
        await invalidateHome();
        return { ok: true };
    }

    async replaceCategories(id: string, categoryIds: string[]) {
        const row = await this.blocks.findById(id);
        if (!row) throw ApiError.notFound("Home layout block not found");
        if (row.type !== "category_row") {
            throw ApiError.badRequest("only category rows have categories");
        }
        await this.assertCategories(categoryIds);
        await this.blocks.replaceBlockCategories(id, categoryIds);
        const result = await this.getAdmin(id);
        await invalidateHome();
        return result;
    }

    async resolvePublic(query: {
        cityId?: string;
        pincode?: string;
        platform?: string;
    }): Promise<PublicLayoutBlock[]> {
        const platform = query.platform ?? "web";
        let resolvedCityId: string | null = null;
        try {
            if (query.cityId) {
                const city = await getActiveCityById(query.cityId);
                resolvedCityId = city.id;
            } else if (query.pincode) {
                const lookup = await lookupPincode(query.pincode);
                if (lookup.deliverable && lookup.city) {
                    resolvedCityId = lookup.city.id;
                }
            }
        } catch {
            return [];
        }
        if (!resolvedCityId) return [];

        const at = new Date();
        const published = (await this.blocks.listPublished()).filter(
            (row) => isPublished(row, at) && matchesCmsHomeLayoutPlatform(row.platforms, platform),
        );

        const cityBlocks = published
            .filter((row) => row.cityId && row.cityId === resolvedCityId)
            .sort((a, b) => a.sortIndex - b.sortIndex);
        const globalBlocks = published
            .filter((row) => !row.cityId)
            .sort((a, b) => a.sortIndex - b.sortIndex);
        const scope = cityBlocks.length > 0 ? cityBlocks : globalBlocks;

        const activeCategories = await this.categories.listActiveTree();
        const categoryById = new Map<string, CategoryAdmin & { children: CategoryAdmin[] }>();
        const indexTree = (nodes: (CategoryAdmin & { children: CategoryAdmin[] })[]) => {
            for (const node of nodes) {
                categoryById.set(node.id, node);
                if (node.children?.length) indexTree(node.children as (CategoryAdmin & { children: CategoryAdmin[] })[]);
            }
        };
        indexTree(activeCategories as (CategoryAdmin & { children: CategoryAdmin[] })[]);

        const flatActive = await this.categoryRepo.listActive();
        const flatById = new Map(flatActive.map((c) => [c.id, c]));
        const childrenByParent = new Map<string, CategoryAdmin[]>();
        for (const cat of flatActive) {
            if (!cat.parentId || !cat.isActive) continue;
            const parent = flatById.get(cat.parentId);
            if (!parent?.isActive) continue;
            const list = childrenByParent.get(cat.parentId) ?? [];
            list.push(cat as CategoryAdmin);
            childrenByParent.set(cat.parentId, list);
        }

        const categoryRowBlockIds = scope
            .filter((row) => row.type === "category_row")
            .map((row) => row.id);
        const blockCategoriesByBlockId = await this.blocks.listBlockCategoriesForBlockIds(
            categoryRowBlockIds,
        );

        const resolved: PublicLayoutBlock[] = [];
        for (const block of scope) {
            if (block.type === "category_row") {
                const mapped = this.resolveCategoryRow(
                    block,
                    categoryById,
                    childrenByParent,
                    flatById,
                    blockCategoriesByBlockId.get(block.id) ?? [],
                );
                if (mapped) resolved.push(mapped);
            } else if (block.type === "product_rail" && block.sectionId) {
                const mapped = await this.resolveProductRail(block, resolvedCityId);
                if (mapped) resolved.push(mapped);
            }
        }
        return resolved;
    }

    private resolveCategoryRow(
        block: CmsHomeLayoutBlock,
        categoryById: Map<string, CategoryAdmin & { children: CategoryAdmin[] }>,
        childrenByParent: Map<string, CategoryAdmin[]>,
        flatById: Map<string, { id: string; isActive: boolean }>,
        links: { categoryId: string; sortIndex: number }[],
    ): PublicCategoryRowBlock | null {
        const config = normalizeCategoryRowConfig(block.config as CategoryRowConfig);
        const categories: PublicLayoutCategory[] = [];
        for (const link of links) {
            const raw = categoryById.get(link.categoryId);
            const flat = flatById.get(link.categoryId);
            if (!raw || !flat?.isActive) continue;
            const children =
                config.enableDrillDown
                    ? (childrenByParent.get(link.categoryId) ?? [])
                          .map((child) => categoryById.get(child.id))
                          .filter((child): child is CategoryAdmin & { children: CategoryAdmin[] } => Boolean(child))
                          .map((child) => this.toPublicCategory(child, [], false))
                    : [];
            categories.push(this.toPublicCategory(raw, children, config.enableDrillDown ?? false));
        }
        if (categories.length === 0) return null;
        return {
            type: "category_row",
            id: block.id,
            title: block.title,
            subtitle: block.subtitle,
            showTitle: block.showTitle,
            showSubtitle: block.showSubtitle,
            maxVisible: Math.min(10, Math.max(1, config.maxVisible ?? 5)),
            showViewAll: config.showViewAll ?? true,
            viewAllHref: config.viewAllHref?.trim() || "/decorations",
            enableDrillDown: config.enableDrillDown ?? false,
            categories,
        };
    }

    private toPublicCategory(
        raw: CategoryAdmin,
        children: PublicLayoutCategory[],
        enableDrillDown: boolean,
    ): PublicLayoutCategory {
        return {
            id: raw.id,
            name: raw.name,
            slug: raw.slug,
            parentId: raw.parentId,
            iconKey: raw.iconKey,
            iconTone: raw.iconTone,
            imageUrl: raw.image?.url ?? null,
            children: enableDrillDown ? children : [],
        };
    }

    private async resolveProductRail(
        block: CmsHomeLayoutBlock,
        cityId: string,
    ): Promise<PublicProductRailBlock | null> {
        if (!block.sectionId) return null;
        const section = await this.sectionRepo.findById(block.sectionId);
        if (!section || !section.isActive) return null;
        const items = await this.sections.resolveProductsForSection(block.sectionId, cityId);
        if (items.length === 0) return null;
        return {
            type: "product_rail",
            id: block.id,
            title: block.title,
            subtitle: block.subtitle,
            showTitle: block.showTitle,
            showSubtitle: block.showSubtitle,
            sectionSlug: section.slug,
            sectionName: section.name,
            sectionBadgeColor: section.badgeColor ?? "amber",
            items,
        };
    }

    private async validateBlock(input: Partial<CreateInput> & { type: CmsHomeLayoutBlock["type"] }) {
        if (input.type === "product_rail") {
            const sectionId = input.sectionId;
            if (!sectionId) {
                throw ApiError.badRequest("product rail requires a catalog section");
            }
            const section = await this.sectionRepo.findById(sectionId);
            if (!section) {
                throw ApiError.notFound("section not found");
            }
            if (!section.isActive) {
                throw ApiError.badRequest("section must be active");
            }
        }
    }

    private async assertCategories(categoryIds: string[]) {
        const unique = [...new Set(categoryIds)];
        if (unique.length !== categoryIds.length) {
            throw ApiError.badRequest("duplicate category in block");
        }
        for (const id of unique) {
            const row = await this.categoryRepo.findById(id);
            if (!row) {
                throw ApiError.notFound("category not found");
            }
        }
    }
}
