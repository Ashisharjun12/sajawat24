import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    cmsFooterColumnLinks,
    cmsFooterColumns,
    type CmsFooterColumn,
    type NewCmsFooterColumn,
} from "@/modules/cms/footer-columns/footer-column.schema.js";

export type CmsFooterColumnPatch = Partial<Omit<NewCmsFooterColumn, "id" | "createdAt" | "updatedAt">>;

export type FooterColumnLinkRow = {
    label: string;
    linkType: string;
    pageId: string | null;
    href: string;
    sortIndex: number;
};

export type FooterColumnWithLinks = CmsFooterColumn & {
    links: FooterColumnLinkRow[];
};

export type FooterLinkInput = {
    label: string;
    linkType: "page" | "custom";
    pageId?: string | null;
    href?: string;
};

export class CmsFooterColumnRepository {
    async findById(id: string): Promise<CmsFooterColumn | undefined> {
        const [row] = await db.select().from(cmsFooterColumns).where(eq(cmsFooterColumns.id, id)).limit(1);
        return row;
    }

    async listLinksForColumn(columnId: string): Promise<FooterColumnLinkRow[]> {
        const rows = await db
            .select({
                label: cmsFooterColumnLinks.label,
                linkType: cmsFooterColumnLinks.linkType,
                pageId: cmsFooterColumnLinks.pageId,
                href: cmsFooterColumnLinks.href,
                sortIndex: cmsFooterColumnLinks.sortIndex,
            })
            .from(cmsFooterColumnLinks)
            .where(eq(cmsFooterColumnLinks.columnId, columnId))
            .orderBy(asc(cmsFooterColumnLinks.sortIndex));
        return rows.map((row) => ({
            label: row.label,
            linkType: row.linkType ?? "custom",
            pageId: row.pageId,
            href: row.href,
            sortIndex: row.sortIndex,
        }));
    }

    async listAdminWithLinks(): Promise<FooterColumnWithLinks[]> {
        const columns = await db
            .select()
            .from(cmsFooterColumns)
            .orderBy(asc(cmsFooterColumns.sortIndex), asc(cmsFooterColumns.createdAt));

        const result: FooterColumnWithLinks[] = [];
        for (const column of columns) {
            const links = await this.listLinksForColumn(column.id);
            result.push({ ...column, links });
        }
        return result;
    }

    async listPublishedWithLinks(): Promise<FooterColumnWithLinks[]> {
        const columns = await db
            .select()
            .from(cmsFooterColumns)
            .where(eq(cmsFooterColumns.status, "published"))
            .orderBy(asc(cmsFooterColumns.sortIndex), asc(cmsFooterColumns.createdAt));

        const result: FooterColumnWithLinks[] = [];
        for (const column of columns) {
            const links = await this.listLinksForColumn(column.id);
            result.push({ ...column, links });
        }
        return result;
    }

    async insert(data: NewCmsFooterColumn): Promise<CmsFooterColumn> {
        const [row] = await db.insert(cmsFooterColumns).values(data).returning();
        return row;
    }

    async update(id: string, data: CmsFooterColumnPatch): Promise<CmsFooterColumn | undefined> {
        const [row] = await db
            .update(cmsFooterColumns)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(cmsFooterColumns.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(cmsFooterColumns).where(eq(cmsFooterColumns.id, id)).returning();
        return rows.length > 0;
    }

    async replaceLinks(
        columnId: string,
        links: FooterLinkInput[],
    ): Promise<FooterColumnWithLinks | undefined> {
        const column = await this.findById(columnId);
        if (!column) return undefined;

        await db.transaction(async (tx) => {
            await tx.delete(cmsFooterColumnLinks).where(eq(cmsFooterColumnLinks.columnId, columnId));
            if (links.length) {
                await tx.insert(cmsFooterColumnLinks).values(
                    links.map((link, index) => ({
                        columnId,
                        label: link.label.trim(),
                        linkType: link.linkType,
                        pageId: link.linkType === "page" ? link.pageId ?? null : null,
                        href: link.linkType === "custom" ? (link.href ?? "").trim() : "",
                        sortIndex: index,
                    })),
                );
            }
        });

        const nextLinks = await this.listLinksForColumn(columnId);
        return { ...column, links: nextLinks };
    }

    async reorder(ids: string[]): Promise<void> {
        const uniqueIds = [...new Set(ids)];
        const rows = await db
            .select({ id: cmsFooterColumns.id })
            .from(cmsFooterColumns)
            .where(inArray(cmsFooterColumns.id, uniqueIds));
        if (rows.length !== uniqueIds.length) {
            throw new Error("Invalid footer column reorder payload");
        }
        const now = new Date();
        await db.transaction(async (tx) => {
            for (let index = 0; index < uniqueIds.length; index += 1) {
                await tx
                    .update(cmsFooterColumns)
                    .set({ sortIndex: index, updatedAt: now })
                    .where(eq(cmsFooterColumns.id, uniqueIds[index]));
            }
        });
    }

    async nextSortIndex(): Promise<number> {
        const [row] = await db
            .select({ max: sql<number>`coalesce(max(${cmsFooterColumns.sortIndex}), -1)` })
            .from(cmsFooterColumns);
        return Number(row?.max ?? -1) + 1;
    }
}
