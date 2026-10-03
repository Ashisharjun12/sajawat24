import { and, asc, count, desc, eq, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import {
    cmsBanners,
    type CmsBanner,
    type NewCmsBanner,
} from "@/modules/cms/banners/banner.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type CmsBannerPatch = Partial<
    Omit<NewCmsBanner, "id" | "createdAt" | "updatedAt">
>;

export type CmsBannerWithCity = CmsBanner & { cityName: string | null };

export type CmsBannerListFilter = {
    placement?: CmsBanner["placement"];
    excludePlacement?: CmsBanner["placement"];
    status?: CmsBanner["status"];
    platform?: string;
};

function platformListFilter(platform: string): SQL {
    if (platform === "android") {
        return or(
            sql`${cmsBanners.platforms} @> ARRAY['android']::text[]`,
            sql`${cmsBanners.platforms} @> ARRAY['mobile']::text[]`,
        )!;
    }
    if (platform === "ios") {
        return or(
            sql`${cmsBanners.platforms} @> ARRAY['ios']::text[]`,
            sql`${cmsBanners.platforms} @> ARRAY['mobile']::text[]`,
        )!;
    }
    return sql`${cmsBanners.platforms} @> ARRAY[${platform}]::text[]`;
}

export class CmsBannerRepository {
    async findById(id: string): Promise<CmsBanner | undefined> {
        const [row] = await db.select().from(cmsBanners).where(eq(cmsBanners.id, id)).limit(1);
        return row;
    }

    async findByIdWithCity(id: string): Promise<CmsBannerWithCity | undefined> {
        const [row] = await db
            .select({
                banner: cmsBanners,
                cityName: cities.name,
            })
            .from(cmsBanners)
            .leftJoin(cities, eq(cmsBanners.cityId, cities.id))
            .where(eq(cmsBanners.id, id))
            .limit(1);
        if (!row) return undefined;
        return { ...row.banner, cityName: row.cityName };
    }

    async listPublished(): Promise<CmsBannerWithCity[]> {
        const rows = await db
            .select({
                banner: cmsBanners,
                cityName: cities.name,
            })
            .from(cmsBanners)
            .leftJoin(cities, eq(cmsBanners.cityId, cities.id))
            .where(eq(cmsBanners.status, "published"))
            .orderBy(desc(cmsBanners.sortIndex), desc(cmsBanners.priority), desc(cmsBanners.updatedAt));
        return rows.map((row) => ({ ...row.banner, cityName: row.cityName }));
    }

    async list(
        pagination: PaginationQuery,
        filter: CmsBannerListFilter = {},
    ): Promise<{ items: CmsBannerWithCity[]; total: number }> {
        const parts: SQL[] = [];
        if (filter.placement) parts.push(eq(cmsBanners.placement, filter.placement));
        if (filter.excludePlacement) parts.push(ne(cmsBanners.placement, filter.excludePlacement));
        if (filter.status) parts.push(eq(cmsBanners.status, filter.status));
        if (filter.platform) parts.push(platformListFilter(filter.platform));
        const where = parts.length ? and(...parts) : undefined;

        const base = db
            .select({
                banner: cmsBanners,
                cityName: cities.name,
            })
            .from(cmsBanners)
            .leftJoin(cities, eq(cmsBanners.cityId, cities.id));

        const rows = await (where ? base.where(where) : base)
            .orderBy(asc(cmsBanners.sortIndex), desc(cmsBanners.updatedAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db.select({ total: count() }).from(cmsBanners);
        const [{ total }] = await (where ? countQuery.where(where) : countQuery);

        return {
            items: rows.map((row) => ({ ...row.banner, cityName: row.cityName })),
            total: Number(total ?? 0),
        };
    }

    async insert(data: NewCmsBanner): Promise<CmsBanner> {
        const [row] = await db.insert(cmsBanners).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsBannerPatch): Promise<CmsBanner | undefined> {
        const [row] = await db
            .update(cmsBanners)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsBanners.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsBanners).where(eq(cmsBanners.id, id)).returning();
        return rows.length > 0;
    }

    async reorder(placement: CmsBanner["placement"], ids: string[]): Promise<void> {
        const uniqueIds = [...new Set(ids)];
        const rows = await db
            .select({ id: cmsBanners.id })
            .from(cmsBanners)
            .where(and(eq(cmsBanners.placement, placement), inArray(cmsBanners.id, uniqueIds)));
        if (rows.length !== uniqueIds.length) {
            throw new Error("Invalid banner reorder payload");
        }
        const now = new Date();
        await db.transaction(async (tx) => {
            for (let index = 0; index < uniqueIds.length; index += 1) {
                await tx
                    .update(cmsBanners)
                    .set({ sortIndex: index, updatedAt: now })
                    .where(and(eq(cmsBanners.id, uniqueIds[index]), eq(cmsBanners.placement, placement)));
            }
        });
    }
}
