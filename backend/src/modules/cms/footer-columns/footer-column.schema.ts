import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cmsStatusEnum } from "@/modules/cms/banners/banner.schema.js";
import { cmsPages } from "@/modules/cms/pages/page.schema.js";

export const cmsFooterColumns = pgTable(
    "cms_footer_columns",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        title: text("title").notNull(),
        status: cmsStatusEnum("status").notNull().default("draft"),
        sortIndex: integer("sort_index").notNull().default(0),
        platforms: text("platforms")
            .array()
            .notNull()
            .default(sql`ARRAY['web','mobile']::text[]`),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [index("cms_footer_columns_status_sort_idx").on(table.status, table.sortIndex)],
);

export const cmsFooterColumnLinks = pgTable("cms_footer_column_links", {
    id: uuid("id").primaryKey().defaultRandom(),
    columnId: uuid("column_id")
        .notNull()
        .references(() => cmsFooterColumns.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    linkType: text("link_type").notNull().default("custom"),
    pageId: uuid("page_id").references(() => cmsPages.id, { onDelete: "restrict" }),
    href: text("href").notNull().default(""),
    sortIndex: integer("sort_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CmsFooterColumn = typeof cmsFooterColumns.$inferSelect;
export type NewCmsFooterColumn = typeof cmsFooterColumns.$inferInsert;
export type CmsFooterColumnLink = typeof cmsFooterColumnLinks.$inferSelect;
