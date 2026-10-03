import { and, asc, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    cmsSocialLinks,
    type CmsSocialLink,
    type NewCmsSocialLink,
} from "@/modules/cms/social-links/social-link.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type CmsSocialLinkPatch = Partial<Omit<NewCmsSocialLink, "id" | "createdAt" | "updatedAt">>;

export class CmsSocialLinkRepository {
    async findById(id: string): Promise<CmsSocialLink | undefined> {
        const [row] = await db.select().from(cmsSocialLinks).where(eq(cmsSocialLinks.id, id)).limit(1);
        return row;
    }

    async listPublished(): Promise<CmsSocialLink[]> {
        return db
            .select()
            .from(cmsSocialLinks)
            .where(eq(cmsSocialLinks.status, "published"))
            .orderBy(asc(cmsSocialLinks.sortIndex), asc(cmsSocialLinks.createdAt));
    }

    async listAllForAdmin(): Promise<CmsSocialLink[]> {
        return db
            .select()
            .from(cmsSocialLinks)
            .orderBy(asc(cmsSocialLinks.sortIndex), asc(cmsSocialLinks.createdAt));
    }

    async list(
        pagination: PaginationQuery,
        filter: { status?: CmsSocialLink["status"] } = {},
    ): Promise<{ items: CmsSocialLink[]; total: number }> {
        const parts: SQL[] = [];
        if (filter.status) parts.push(eq(cmsSocialLinks.status, filter.status));
        const where = parts.length ? and(...parts) : undefined;

        const rows = await (where
            ? db.select().from(cmsSocialLinks).where(where)
            : db.select().from(cmsSocialLinks))
            .orderBy(asc(cmsSocialLinks.sortIndex), asc(cmsSocialLinks.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db.select({ total: count() }).from(cmsSocialLinks);
        const [{ total }] = await (where ? countQuery.where(where) : countQuery);

        return { items: rows, total: Number(total ?? 0) };
    }

    async insert(data: NewCmsSocialLink): Promise<CmsSocialLink> {
        const [row] = await db.insert(cmsSocialLinks).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsSocialLinkPatch): Promise<CmsSocialLink | undefined> {
        const [row] = await db
            .update(cmsSocialLinks)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsSocialLinks.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsSocialLinks).where(eq(cmsSocialLinks.id, id)).returning();
        return rows.length > 0;
    }

    async reorder(ids: string[]): Promise<void> {
        const uniqueIds = [...new Set(ids)];
        const rows = await db
            .select({ id: cmsSocialLinks.id })
            .from(cmsSocialLinks)
            .where(inArray(cmsSocialLinks.id, uniqueIds));
        if (rows.length !== uniqueIds.length) {
            throw new Error("Invalid social link reorder payload");
        }
        const now = new Date();
        await db.transaction(async (tx) => {
            for (let index = 0; index < uniqueIds.length; index += 1) {
                await tx
                    .update(cmsSocialLinks)
                    .set({ sortIndex: index, updatedAt: now })
                    .where(eq(cmsSocialLinks.id, uniqueIds[index]));
            }
        });
    }

    async nextSortIndex(): Promise<number> {
        const [row] = await db
            .select({ max: sql<number>`coalesce(max(${cmsSocialLinks.sortIndex}), -1)` })
            .from(cmsSocialLinks);
        return Number(row?.max ?? -1) + 1;
    }
}
