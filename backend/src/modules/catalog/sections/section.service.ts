import { ApiError } from "@/shared/errors/apiError.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import { getActiveCityById, lookupPincode } from "@/modules/geo/index.js";
import { slugify } from "@/modules/catalog/slug.js";
import type { ICityRepository } from "@/modules/geo/cities/city.repository.js";
import { publicCity, type PublicCity } from "@/modules/geo/cities/city.public.js";
import type { IProductService, ProductAdmin, ProductForCity } from "@/modules/catalog/products/product.service.js";
import type { ISectionRepository } from "@/modules/catalog/sections/section.repository.js";
import type { CatalogSection } from "@/modules/catalog/sections/section.schema.js";
import {
    DEFAULT_SECTION_BADGE_COLOR,
    parseSectionBadgeColor,
} from "@/modules/catalog/sections/section-badge-color.js";
import { invalidateHome } from "@/modules/cms/cache/cms-cache.invalidation.js";

export type CreateSectionInput = {
    name: string;
    slug?: string;
    sortIndex?: number;
    badgeColor?: string;
    isActive?: boolean;
};

export type PatchSectionInput = {
    name?: string;
    slug?: string;
    sortIndex?: number;
    badgeColor?: string;
    isActive?: boolean;
};

export type PutSectionProductsInput = {
    cityId: string | null;
    productIds: string[];
};

export type SectionMembershipItem = {
    productId: string;
    sortIndex: number;
    product: ProductAdmin;
};

export type SectionMembership = {
    source: "global" | "city";
    items: SectionMembershipItem[];
};

export type PublicSection = CatalogSection & {
    source: "global" | "city";
    items: ProductForCity[];
};

export type GlobalProductOccupancyItem = {
    productId: string;
    sectionId: string;
    sectionName: string;
};

export interface ISectionService {
    listAdmin(): Promise<{ items: CatalogSection[] }>;
    listGlobalProductOccupancy(): Promise<{ items: GlobalProductOccupancyItem[] }>;
    create(input: CreateSectionInput): Promise<CatalogSection>;
    patch(id: string, input: PatchSectionInput): Promise<CatalogSection>;
    delete(id: string): Promise<void>;
    listProducts(id: string, cityId?: string): Promise<SectionMembership>;
    replaceProducts(id: string, input: PutSectionProductsInput): Promise<SectionMembership>;
    deleteCityOverride(id: string, cityId: string): Promise<SectionMembership>;
    listPublic(query: {
        pincode?: string;
        cityId?: string;
    }): Promise<{ city: PublicCity; sections: PublicSection[] }>;
    resolveProductsForSection(sectionId: string, cityId: string): Promise<ProductForCity[]>;
}

export class SectionService implements ISectionService {
    constructor(
        private readonly sections: ISectionRepository,
        private readonly products: IProductService,
        private readonly cities: ICityRepository,
    ) {}

    async listAdmin(): Promise<{ items: CatalogSection[] }> {
        const items = await this.sections.listAll();
        return { items };
    }

    async listGlobalProductOccupancy(): Promise<{ items: GlobalProductOccupancyItem[] }> {
        const items = await this.sections.findGlobalProductOccupancy();
        return { items };
    }

    async create(input: CreateSectionInput): Promise<CatalogSection> {
        const name = input.name.trim();
        const slug = slugify(input.slug?.trim() || name);
        if (!slug) {
            throw ApiError.badRequest("invalid section slug");
        }
        try {
            const row = await this.sections.insert({
                name,
                slug,
                sortIndex: input.sortIndex ?? 0,
                badgeColor: parseSectionBadgeColor(input.badgeColor ?? DEFAULT_SECTION_BADGE_COLOR),
                isActive: input.isActive ?? true,
            });
            await invalidateHome();
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("section slug already exists");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchSectionInput): Promise<CatalogSection> {
        await this.requireSection(id);
        const data: Parameters<ISectionRepository["update"]>[1] = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.slug !== undefined) {
            const slug = slugify(input.slug);
            if (!slug) throw ApiError.badRequest("invalid section slug");
            data.slug = slug;
        } else if (input.name !== undefined) {
            data.slug = slugify(input.name);
        }
        if (input.sortIndex !== undefined) data.sortIndex = input.sortIndex;
        if (input.badgeColor !== undefined) {
            data.badgeColor = parseSectionBadgeColor(input.badgeColor);
        }
        if (input.isActive !== undefined) data.isActive = input.isActive;
        try {
            const row = await this.sections.update(id, data);
            if (!row) {
                throw ApiError.notFound("section not found");
            }
            await invalidateHome();
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("section slug already exists");
            }
            throw err;
        }
    }

    async delete(id: string): Promise<void> {
        await this.requireSection(id);
        const deleted = await this.sections.delete(id);
        if (!deleted) {
            throw ApiError.notFound("section not found");
        }
        await invalidateHome();
    }

    async listProducts(id: string, cityId?: string): Promise<SectionMembership> {
        await this.requireSection(id);
        if (cityId) {
            await this.requireCity(cityId);
        }
        return this.membership(id, cityId);
    }

    async replaceProducts(id: string, input: PutSectionProductsInput): Promise<SectionMembership> {
        await this.requireSection(id);
        if (input.cityId) {
            await this.requireCity(input.cityId);
        }
        await this.assertProductsExist(input.productIds);
        if (input.cityId === null) {
            await this.assertGlobalSectionExclusive(id, input.productIds);
        }
        await this.sections.replaceProducts(id, input.cityId, input.productIds);
        await invalidateHome();
        return this.membership(id, input.cityId ?? undefined);
    }

    async deleteCityOverride(id: string, cityId: string): Promise<SectionMembership> {
        await this.requireSection(id);
        await this.requireCity(cityId);
        const deleted = await this.sections.deleteCityOverride(id, cityId);
        if (!deleted) {
            throw ApiError.notFound("city override not found");
        }
        await invalidateHome();
        return this.membership(id, cityId);
    }

    async resolveProductsForSection(sectionId: string, cityId: string): Promise<ProductForCity[]> {
        const section = await this.sections.findById(sectionId);
        if (!section || !section.isActive) {
            return [];
        }
        const { items } = await this.resolvePublicSectionItems(sectionId, cityId);
        return items;
    }

    async listPublic(query: {
        pincode?: string;
        cityId?: string;
    }): Promise<{ city: PublicCity; sections: PublicSection[] }> {
        const resolved = await this.resolvePublicCity(query);
        const cityId = resolved.id;
        const rows = await this.sections.listActive();
        const sections: PublicSection[] = [];
        for (const section of rows) {
            const { source, items } = await this.resolvePublicSectionItems(section.id, cityId);
            if (items.length === 0) continue;
            sections.push({ ...section, source, items });
        }
        return { city: resolved, sections };
    }

    private async resolvePublicSectionItems(
        sectionId: string,
        cityId: string,
    ): Promise<{ source: "global" | "city"; items: ProductForCity[] }> {
        const override = await this.sections.findOverride(sectionId, cityId);
        const globalMembership = await this.sections.listProducts(sectionId, null);
        const cityMembership = override
            ? await this.sections.listProducts(sectionId, cityId)
            : [];

        const tryMembership = async (
            rows: { productId: string }[],
            source: "global" | "city",
        ): Promise<{ source: "global" | "city"; items: ProductForCity[] }> => {
            const items = await this.products.listForCityByIds(
                cityId,
                rows.map((row) => row.productId),
            );
            return { source, items };
        };

        if (override && cityMembership.length > 0) {
            const cityResult = await tryMembership(cityMembership, "city");
            if (cityResult.items.length > 0) {
                return cityResult;
            }
        }

        if (globalMembership.length > 0) {
            return tryMembership(globalMembership, "global");
        }

        return { source: "global", items: [] };
    }

    private async resolvePublicCity(query: {
        pincode?: string;
        cityId?: string;
    }): Promise<PublicCity> {
        const cityId = query.cityId?.trim() ?? "";
        const pincode = String(query.pincode ?? "").trim();
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

    private async membership(sectionId: string, cityId?: string): Promise<SectionMembership> {
        const override = cityId ? await this.sections.findOverride(sectionId, cityId) : undefined;
        const source: "global" | "city" = override ? "city" : "global";
        const rows = await this.sections.listProducts(sectionId, source === "city" && cityId ? cityId : null);
        const products = await this.products.adminByIds(rows.map((row) => row.productId));
        const byId = new Map(products.map((product) => [product.id, product]));
        const items: SectionMembershipItem[] = [];
        for (const row of rows) {
            const product = byId.get(row.productId);
            if (!product) continue;
            items.push({ productId: row.productId, sortIndex: row.sortIndex, product });
        }
        return { source, items };
    }

    private async requireSection(id: string): Promise<CatalogSection> {
        const row = await this.sections.findById(id);
        if (!row) {
            throw ApiError.notFound("section not found");
        }
        return row;
    }

    private async requireCity(cityId: string): Promise<void> {
        const city = await this.cities.findById(cityId);
        if (!city) {
            throw ApiError.notFound("city not found");
        }
    }

    private async assertProductsExist(productIds: string[]): Promise<void> {
        if (productIds.length === 0) return;
        const found = await this.products.findByIds(productIds);
        if (found.length !== productIds.length) {
            throw ApiError.badRequest("product not found");
        }
    }

    private async assertGlobalSectionExclusive(sectionId: string, productIds: string[]): Promise<void> {
        if (productIds.length === 0) return;
        const rows = await this.sections.findGlobalProductOccupancy();
        const byProduct = new Map(rows.map((row) => [row.productId, row]));
        for (const productId of productIds) {
            const existing = byProduct.get(productId);
            if (existing && existing.sectionId !== sectionId) {
                throw ApiError.badRequest(
                    `product is already in global section "${existing.sectionName}"`,
                );
            }
        }
    }
}
