import { and, asc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import {
    cmsHomeBlockCategories,
    cmsHomeLayoutBlocks,
    type CmsHomeLayoutBlock,
    type NewCmsHomeLayoutBlock,
} from "@/modules/cms/home-layout/home-layout.schema.js";

export type CmsHomeLayoutBlockPatch = Partial<
    Omit<NewCmsHomeLayoutBlock, "id" | "createdAt" | "updatedAt">
>;

export type CmsHomeLayoutBlockWithCity = CmsHomeLayoutBlock & { cityName: string | null };

export type BlockCategoryRow = {
    categoryId: string;
    sortIndex: number;
};

export class CmsHomeLayoutRepository {
    async findById(id: string): Promise<CmsHomeLayoutBlock | undefined> {
        const [row] = await db
            .select()
            .from(cmsHomeLayoutBlocks)
            .where(eq(cmsHomeLayoutBlocks.id, id))
            .limit(1);
        return row;
    }

    async findByIdWithCity(id: string): Promise<CmsHomeLayoutBlockWithCity | undefined> {
        const [row] = await db
            .select({
                block: cmsHomeLayoutBlocks,
                cityName: cities.name,
            })
            .from(cmsHomeLayoutBlocks)
            .leftJoin(cities, eq(cmsHomeLayoutBlocks.cityId, cities.id))
            .where(eq(cmsHomeLayoutBlocks.id, id))
            .limit(1);
        if (!row) return undefined;
        return { ...row.block, cityName: row.cityName };
    }

    async listAdmin(filter: { cityId?: string | null; status?: CmsHomeLayoutBlock["status"] }) {
        const parts: SQL[] = [];
        if (filter.cityId === null) {
            parts.push(isNull(cmsHomeLayoutBlocks.cityId));
        } else if (filter.cityId) {
            parts.push(eq(cmsHomeLayoutBlocks.cityId, filter.cityId));
        }
        if (filter.status) {
            parts.push(eq(cmsHomeLayoutBlocks.status, filter.status));
        }
        const where = parts.length ? and(...parts) : undefined;

        const base = db
            .select({
                block: cmsHomeLayoutBlocks,
                cityName: cities.name,
            })
            .from(cmsHomeLayoutBlocks)
            .leftJoin(cities, eq(cmsHomeLayoutBlocks.cityId, cities.id));

        const rows = await (where ? base.where(where) : base).orderBy(
            asc(cmsHomeLayoutBlocks.sortIndex),
            asc(cmsHomeLayoutBlocks.createdAt),
        );

        return rows.map((row) => ({ ...row.block, cityName: row.cityName }));
    }

    async listPublished(): Promise<CmsHomeLayoutBlockWithCity[]> {
        const rows = await db
            .select({
                block: cmsHomeLayoutBlocks,
                cityName: cities.name,
            })
            .from(cmsHomeLayoutBlocks)
            .leftJoin(cities, eq(cmsHomeLayoutBlocks.cityId, cities.id))
            .where(eq(cmsHomeLayoutBlocks.status, "published"))
            .orderBy(asc(cmsHomeLayoutBlocks.sortIndex), asc(cmsHomeLayoutBlocks.createdAt));
        return rows.map((row) => ({ ...row.block, cityName: row.cityName }));
    }

    async insert(data: NewCmsHomeLayoutBlock): Promise<CmsHomeLayoutBlock> {
        const [row] = await db.insert(cmsHomeLayoutBlocks).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsHomeLayoutBlockPatch): Promise<CmsHomeLayoutBlock | undefined> {
        const [row] = await db
            .update(cmsHomeLayoutBlocks)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsHomeLayoutBlocks.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsHomeLayoutBlocks).where(eq(cmsHomeLayoutBlocks.id, id)).returning();
        return rows.length > 0;
    }

    async listBlockCategories(blockId: string): Promise<BlockCategoryRow[]> {
        const rows = await db
            .select({
                categoryId: cmsHomeBlockCategories.categoryId,
                sortIndex: cmsHomeBlockCategories.sortIndex,
            })
            .from(cmsHomeBlockCategories)
            .where(eq(cmsHomeBlockCategories.blockId, blockId))
            .orderBy(asc(cmsHomeBlockCategories.sortIndex));
        return rows;
    }

    async listBlockCategoriesForBlockIds(blockIds: string[]): Promise<Map<string, BlockCategoryRow[]>> {
        const unique = [...new Set(blockIds.filter(Boolean))];
        const result = new Map<string, BlockCategoryRow[]>();
        if (unique.length === 0) return result;

        const rows = await db
            .select({
                blockId: cmsHomeBlockCategories.blockId,
                categoryId: cmsHomeBlockCategories.categoryId,
                sortIndex: cmsHomeBlockCategories.sortIndex,
            })
            .from(cmsHomeBlockCategories)
            .where(inArray(cmsHomeBlockCategories.blockId, unique))
            .orderBy(asc(cmsHomeBlockCategories.sortIndex));

        for (const row of rows) {
            const list = result.get(row.blockId) ?? [];
            list.push({ categoryId: row.categoryId, sortIndex: row.sortIndex });
            result.set(row.blockId, list);
        }
        return result;
    }

    async replaceBlockCategories(blockId: string, categoryIds: string[]): Promise<void> {
        const unique = [...new Set(categoryIds)];
        await db.transaction(async (tx) => {
            await tx.delete(cmsHomeBlockCategories).where(eq(cmsHomeBlockCategories.blockId, blockId));
            if (unique.length === 0) return;
            await tx.insert(cmsHomeBlockCategories).values(
                unique.map((categoryId, index) => ({
                    blockId,
                    categoryId,
                    sortIndex: index,
                })),
            );
        });
    }

    async reorder(cityId: string | null, ids: string[]): Promise<void> {
        const uniqueIds = [...new Set(ids)];
        const scope =
            cityId === null
                ? isNull(cmsHomeLayoutBlocks.cityId)
                : eq(cmsHomeLayoutBlocks.cityId, cityId);
        const rows = await db
            .select({ id: cmsHomeLayoutBlocks.id })
            .from(cmsHomeLayoutBlocks)
            .where(and(scope, inArray(cmsHomeLayoutBlocks.id, uniqueIds)));
        if (rows.length !== uniqueIds.length) {
            throw new Error("Invalid home layout reorder payload");
        }
        const now = new Date();
        await db.transaction(async (tx) => {
            for (let index = 0; index < uniqueIds.length; index += 1) {
                await tx
                    .update(cmsHomeLayoutBlocks)
                    .set({ sortIndex: index, updatedAt: now })
                    .where(and(eq(cmsHomeLayoutBlocks.id, uniqueIds[index]), scope));
            }
        });
    }

    async nextSortIndex(cityId: string | null): Promise<number> {
        const scope =
            cityId === null
                ? isNull(cmsHomeLayoutBlocks.cityId)
                : eq(cmsHomeLayoutBlocks.cityId, cityId);
        const [row] = await db
            .select({ max: sql<number>`coalesce(max(${cmsHomeLayoutBlocks.sortIndex}), -1)` })
            .from(cmsHomeLayoutBlocks)
            .where(scope);
        return Number(row?.max ?? -1) + 1;
    }
}
