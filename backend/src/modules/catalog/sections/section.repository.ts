import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    catalogSectionCityOverrides,
    catalogSectionProducts,
    catalogSections,
    type CatalogSection,
    type CatalogSectionCityOverride,
    type CatalogSectionProduct,
    type NewCatalogSection,
} from "@/modules/catalog/sections/section.schema.js";

export type SectionPatch = Partial<
    Pick<CatalogSection, "name" | "slug" | "sortIndex" | "badgeColor" | "isActive">
>;

export type GlobalSectionProductOccupancy = {
    productId: string;
    sectionId: string;
    sectionName: string;
};

export interface ISectionRepository {
    listAll(): Promise<CatalogSection[]>;
    listActive(): Promise<CatalogSection[]>;
    findById(id: string): Promise<CatalogSection | undefined>;
    insert(data: NewCatalogSection): Promise<CatalogSection>;
    update(id: string, data: SectionPatch): Promise<CatalogSection | undefined>;
    delete(id: string): Promise<boolean>;
    findOverride(sectionId: string, cityId: string): Promise<CatalogSectionCityOverride | undefined>;
    listProducts(sectionId: string, cityId: string | null): Promise<CatalogSectionProduct[]>;
    replaceProducts(sectionId: string, cityId: string | null, productIds: string[]): Promise<void>;
    deleteCityOverride(sectionId: string, cityId: string): Promise<boolean>;
    findGlobalProductOccupancy(): Promise<GlobalSectionProductOccupancy[]>;
}

export class SectionRepository implements ISectionRepository {
    async listAll(): Promise<CatalogSection[]> {
        return db
            .select()
            .from(catalogSections)
            .orderBy(asc(catalogSections.sortIndex), asc(catalogSections.name));
    }

    async listActive(): Promise<CatalogSection[]> {
        return db
            .select()
            .from(catalogSections)
            .where(eq(catalogSections.isActive, true))
            .orderBy(asc(catalogSections.sortIndex), asc(catalogSections.name));
    }

    async findById(id: string): Promise<CatalogSection | undefined> {
        const [row] = await db.select().from(catalogSections).where(eq(catalogSections.id, id)).limit(1);
        return row;
    }

    async insert(data: NewCatalogSection): Promise<CatalogSection> {
        const [row] = await db.insert(catalogSections).values(data).returning();
        if (!row) {
            throw new Error("failed to create section");
        }
        return row;
    }

    async update(id: string, data: SectionPatch): Promise<CatalogSection | undefined> {
        const [row] = await db
            .update(catalogSections)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(catalogSections.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await db
            .delete(catalogSections)
            .where(eq(catalogSections.id, id))
            .returning({ id: catalogSections.id });
        return deleted.length > 0;
    }

    async findOverride(sectionId: string, cityId: string): Promise<CatalogSectionCityOverride | undefined> {
        const [row] = await db
            .select()
            .from(catalogSectionCityOverrides)
            .where(
                and(
                    eq(catalogSectionCityOverrides.sectionId, sectionId),
                    eq(catalogSectionCityOverrides.cityId, cityId),
                ),
            )
            .limit(1);
        return row;
    }

    async listProducts(sectionId: string, cityId: string | null): Promise<CatalogSectionProduct[]> {
        const cityFilter =
            cityId === null
                ? isNull(catalogSectionProducts.cityId)
                : eq(catalogSectionProducts.cityId, cityId);
        return db
            .select()
            .from(catalogSectionProducts)
            .where(and(eq(catalogSectionProducts.sectionId, sectionId), cityFilter))
            .orderBy(asc(catalogSectionProducts.sortIndex));
    }

    async replaceProducts(sectionId: string, cityId: string | null, productIds: string[]): Promise<void> {
        await db.transaction(async (tx) => {
            const cityFilter =
                cityId === null
                    ? isNull(catalogSectionProducts.cityId)
                    : eq(catalogSectionProducts.cityId, cityId);
            await tx
                .delete(catalogSectionProducts)
                .where(and(eq(catalogSectionProducts.sectionId, sectionId), cityFilter));
            if (cityId) {
                await tx
                    .insert(catalogSectionCityOverrides)
                    .values({ sectionId, cityId })
                    .onConflictDoNothing();
            }
            if (productIds.length === 0) return;
            await tx.insert(catalogSectionProducts).values(
                productIds.map((productId, sortIndex) => ({
                    sectionId,
                    productId,
                    cityId,
                    sortIndex,
                })),
            );
        });
    }

    async findGlobalProductOccupancy(): Promise<GlobalSectionProductOccupancy[]> {
        return db
            .select({
                productId: catalogSectionProducts.productId,
                sectionId: catalogSections.id,
                sectionName: catalogSections.name,
            })
            .from(catalogSectionProducts)
            .innerJoin(catalogSections, eq(catalogSectionProducts.sectionId, catalogSections.id))
            .where(isNull(catalogSectionProducts.cityId));
    }

    async deleteCityOverride(sectionId: string, cityId: string): Promise<boolean> {
        return db.transaction(async (tx) => {
            await tx
                .delete(catalogSectionProducts)
                .where(
                    and(eq(catalogSectionProducts.sectionId, sectionId), eq(catalogSectionProducts.cityId, cityId)),
                );
            const deleted = await tx
                .delete(catalogSectionCityOverrides)
                .where(
                    and(
                        eq(catalogSectionCityOverrides.sectionId, sectionId),
                        eq(catalogSectionCityOverrides.cityId, cityId),
                    ),
                )
                .returning({ id: catalogSectionCityOverrides.id });
            return deleted.length > 0;
        });
    }
}
