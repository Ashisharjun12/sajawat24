import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { cmsStatusEnum } from "@/modules/cms/banners/banner.schema.js";

export const cmsPages = pgTable(
    "cms_pages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        slug: text("slug").notNull(),
        title: text("title").notNull(),
        body: text("body").notNull().default(""),
        status: cmsStatusEnum("status").notNull().default("draft"),
        sortIndex: integer("sort_index").notNull().default(0),
        platforms: text("platforms")
            .array()
            .notNull()
            .default(sql`ARRAY['web','mobile']::text[]`),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("cms_pages_slug_unique").on(table.slug),
        index("cms_pages_status_sort_idx").on(table.status, table.sortIndex),
    ],
);

export type CmsPage = typeof cmsPages.$inferSelect;
export type NewCmsPage = typeof cmsPages.$inferInsert;
