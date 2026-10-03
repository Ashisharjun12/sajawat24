import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import {
    cmsTestimonials,
    type CmsTestimonial,
    type NewCmsTestimonial,
} from "@/modules/cms/testimonials/testimonial.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type CmsTestimonialPatch = Partial<
    Omit<NewCmsTestimonial, "id" | "createdAt" | "updatedAt">
>;

export type CmsTestimonialWithCity = CmsTestimonial & { cityName: string | null };

export type CmsTestimonialListFilter = {
    status?: CmsTestimonial["status"];
};

export class CmsTestimonialRepository {
    async findById(id: string): Promise<CmsTestimonial | undefined> {
        const [row] = await db.select().from(cmsTestimonials).where(eq(cmsTestimonials.id, id)).limit(1);
        return row;
    }

    async findByIdWithCity(id: string): Promise<CmsTestimonialWithCity | undefined> {
        const [row] = await db
            .select({
                testimonial: cmsTestimonials,
                cityName: cities.name,
            })
            .from(cmsTestimonials)
            .leftJoin(cities, eq(cmsTestimonials.cityId, cities.id))
            .where(eq(cmsTestimonials.id, id))
            .limit(1);
        if (!row) return undefined;
        return { ...row.testimonial, cityName: row.cityName };
    }

    async listPublished(): Promise<CmsTestimonialWithCity[]> {
        const rows = await db
            .select({
                testimonial: cmsTestimonials,
                cityName: cities.name,
            })
            .from(cmsTestimonials)
            .leftJoin(cities, eq(cmsTestimonials.cityId, cities.id))
            .where(eq(cmsTestimonials.status, "published"))
            .orderBy(desc(cmsTestimonials.sortIndex), desc(cmsTestimonials.createdAt));
        return rows.map((row) => ({ ...row.testimonial, cityName: row.cityName }));
    }

    async list(
        pagination: PaginationQuery,
        filter: CmsTestimonialListFilter = {},
    ): Promise<{ items: CmsTestimonialWithCity[]; total: number }> {
        const parts: SQL[] = [];
        if (filter.status) parts.push(eq(cmsTestimonials.status, filter.status));
        const where = parts.length ? and(...parts) : undefined;

        const base = db
            .select({
                testimonial: cmsTestimonials,
                cityName: cities.name,
            })
            .from(cmsTestimonials)
            .leftJoin(cities, eq(cmsTestimonials.cityId, cities.id));

        const rows = await (where ? base.where(where) : base)
            .orderBy(desc(cmsTestimonials.sortIndex), desc(cmsTestimonials.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db.select({ total: count() }).from(cmsTestimonials);
        const [{ total }] = await (where ? countQuery.where(where) : countQuery);

        return {
            items: rows.map((row) => ({ ...row.testimonial, cityName: row.cityName })),
            total: Number(total ?? 0),
        };
    }

    async insert(data: NewCmsTestimonial): Promise<CmsTestimonial> {
        const [row] = await db.insert(cmsTestimonials).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsTestimonialPatch): Promise<CmsTestimonial | undefined> {
        const [row] = await db
            .update(cmsTestimonials)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsTestimonials.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsTestimonials).where(eq(cmsTestimonials.id, id)).returning();
        return rows.length > 0;
    }
}
