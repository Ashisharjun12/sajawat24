import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { cities, type City, type NewCity } from "@/modules/geo/cities/city.schema.js";

export type CityPatch = Partial<Pick<City, "name" | "slug" | "state" | "isActive" | "imageUploadId">>;

export type CityListFilter = {
    q?: string;
    isActive?: boolean;
};

export interface ICityRepository {
    findById(id: string): Promise<City | undefined>;
    findBySlug(slug: string): Promise<City | undefined>;
    listActive(): Promise<City[]>;
    list(
        pagination: PaginationQuery,
        filter?: CityListFilter,
    ): Promise<{ items: City[]; total: number }>;
    insert(data: NewCity): Promise<City>;
    update(id: string, data: CityPatch): Promise<City | undefined>;
}

function cityListWhere(filter: CityListFilter = {}): SQL | undefined {
    const conditions: SQL[] = [];
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        const match = or(ilike(cities.name, pattern), ilike(cities.slug, pattern));
        if (match) conditions.push(match);
    }
    if (filter.isActive !== undefined) {
        conditions.push(eq(cities.isActive, filter.isActive));
    }
    return conditions.length ? and(...conditions) : undefined;
}

export class CityRepository implements ICityRepository {
    async findById(id: string): Promise<City | undefined> {
        const [row] = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
        return row;
    }

    async findBySlug(slug: string): Promise<City | undefined> {
        const [row] = await db.select().from(cities).where(eq(cities.slug, slug)).limit(1);
        return row;
    }

    async listActive(): Promise<City[]> {
        return db
            .select()
            .from(cities)
            .where(eq(cities.isActive, true))
            .orderBy(cities.name);
    }

    async list(
        pagination: PaginationQuery,
        filter: CityListFilter = {},
    ): Promise<{ items: City[]; total: number }> {
        const where = cityListWhere(filter);
        const [totalRow] = await db.select({ value: count() }).from(cities).where(where);
        const items = await db
            .select()
            .from(cities)
            .where(where)
            .orderBy(desc(cities.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        return { items, total: Number(totalRow?.value ?? 0) };
    }

    async insert(data: NewCity): Promise<City> {
        const [row] = await db.insert(cities).values(data).returning();
        if (!row) {
            throw new Error("failed to create city");
        }
        return row;
    }

    async update(id: string, data: CityPatch): Promise<City | undefined> {
        const [row] = await db
            .update(cities)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cities.id, id))
            .returning();
        return row;
    }
}
