import { and, asc, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    cmsHomeFaqItems,
    type CmsHomeFaqItem,
    type NewCmsHomeFaqItem,
} from "@/modules/cms/faq/faq.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type CmsHomeFaqPatch = Partial<Omit<NewCmsHomeFaqItem, "id" | "createdAt" | "updatedAt">>;

export type CmsHomeFaqListFilter = {
    status?: CmsHomeFaqItem["status"];
};

export class CmsHomeFaqRepository {
    async findById(id: string): Promise<CmsHomeFaqItem | undefined> {
        const [row] = await db.select().from(cmsHomeFaqItems).where(eq(cmsHomeFaqItems.id, id)).limit(1);
        return row;
    }

    async listPublished(): Promise<CmsHomeFaqItem[]> {
        return db
            .select()
            .from(cmsHomeFaqItems)
            .where(eq(cmsHomeFaqItems.status, "published"))
            .orderBy(asc(cmsHomeFaqItems.sortIndex), asc(cmsHomeFaqItems.createdAt));
    }

    async list(
        pagination: PaginationQuery,
        filter: CmsHomeFaqListFilter = {},
    ): Promise<{ items: CmsHomeFaqItem[]; total: number }> {
        const parts: SQL[] = [];
        if (filter.status) parts.push(eq(cmsHomeFaqItems.status, filter.status));
        const where = parts.length ? and(...parts) : undefined;

        const rows = await (where
            ? db.select().from(cmsHomeFaqItems).where(where)
            : db.select().from(cmsHomeFaqItems))
            .orderBy(asc(cmsHomeFaqItems.sortIndex), asc(cmsHomeFaqItems.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db.select({ total: count() }).from(cmsHomeFaqItems);
        const [{ total }] = await (where ? countQuery.where(where) : countQuery);

        return { items: rows, total: Number(total ?? 0) };
    }

    async insert(data: NewCmsHomeFaqItem): Promise<CmsHomeFaqItem> {
        const [row] = await db.insert(cmsHomeFaqItems).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsHomeFaqPatch): Promise<CmsHomeFaqItem | undefined> {
        const [row] = await db
            .update(cmsHomeFaqItems)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsHomeFaqItems.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsHomeFaqItems).where(eq(cmsHomeFaqItems.id, id)).returning();
        return rows.length > 0;
    }

    async reorder(ids: string[]): Promise<void> {
        const uniqueIds = [...new Set(ids)];
        const rows = await db
            .select({ id: cmsHomeFaqItems.id })
            .from(cmsHomeFaqItems)
            .where(inArray(cmsHomeFaqItems.id, uniqueIds));
        if (rows.length !== uniqueIds.length) {
            throw new Error("Invalid FAQ reorder payload");
        }
        const now = new Date();
        await db.transaction(async (tx) => {
            for (let index = 0; index < uniqueIds.length; index += 1) {
                await tx
                    .update(cmsHomeFaqItems)
                    .set({ sortIndex: index, updatedAt: now })
                    .where(eq(cmsHomeFaqItems.id, uniqueIds[index]));
            }
        });
    }

    async nextSortIndex(): Promise<number> {
        const [row] = await db
            .select({ max: sql<number>`coalesce(max(${cmsHomeFaqItems.sortIndex}), -1)` })
            .from(cmsHomeFaqItems);
        return Number(row?.max ?? -1) + 1;
    }
}
