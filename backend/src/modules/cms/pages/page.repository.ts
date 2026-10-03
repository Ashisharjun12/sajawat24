import { and, asc, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { cmsPages, type CmsPage, type NewCmsPage } from "@/modules/cms/pages/page.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type CmsPagePatch = Partial<Omit<NewCmsPage, "id" | "createdAt" | "updatedAt">>;

export type CmsPageListFilter = {
    status?: CmsPage["status"];
};

export class CmsPageRepository {
    async findById(id: string): Promise<CmsPage | undefined> {
        const [row] = await db.select().from(cmsPages).where(eq(cmsPages.id, id)).limit(1);
        return row;
    }

    async findBySlug(slug: string): Promise<CmsPage | undefined> {
        const [row] = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
        return row;
    }

    async findByIds(ids: string[]): Promise<CmsPage[]> {
        if (!ids.length) return [];
        return db.select().from(cmsPages).where(inArray(cmsPages.id, ids));
    }

    async listPublishedPicker(): Promise<Pick<CmsPage, "id" | "title" | "slug">[]> {
        return db
            .select({
                id: cmsPages.id,
                title: cmsPages.title,
                slug: cmsPages.slug,
            })
            .from(cmsPages)
            .where(eq(cmsPages.status, "published"))
            .orderBy(asc(cmsPages.sortIndex), asc(cmsPages.title));
    }

    async list(
        pagination: PaginationQuery,
        filter: CmsPageListFilter = {},
    ): Promise<{ items: CmsPage[]; total: number }> {
        const parts: SQL[] = [];
        if (filter.status) parts.push(eq(cmsPages.status, filter.status));
        const where = parts.length ? and(...parts) : undefined;

        const rows = await (where
            ? db.select().from(cmsPages).where(where)
            : db.select().from(cmsPages))
            .orderBy(asc(cmsPages.sortIndex), asc(cmsPages.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db.select({ total: count() }).from(cmsPages);
        const [{ total }] = await (where ? countQuery.where(where) : countQuery);

        return { items: rows, total: Number(total ?? 0) };
    }

    async insert(data: NewCmsPage): Promise<CmsPage> {
        const [row] = await db.insert(cmsPages).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsPagePatch): Promise<CmsPage | undefined> {
        const [row] = await db
            .update(cmsPages)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsPages.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsPages).where(eq(cmsPages.id, id)).returning();
        return rows.length > 0;
    }

    async nextSortIndex(): Promise<number> {
        const [row] = await db
            .select({ max: sql<number>`coalesce(max(${cmsPages.sortIndex}), -1)` })
            .from(cmsPages);
        return Number(row?.max ?? -1) + 1;
    }
}
