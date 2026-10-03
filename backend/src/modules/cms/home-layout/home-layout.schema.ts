import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { catalogSections } from "@/modules/catalog/sections/section.schema.js";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { cmsStatusEnum } from "@/modules/cms/banners/banner.schema.js";

export const cmsHomeBlockTypeEnum = pgEnum("cms_home_block_type", ["category_row", "product_rail"]);

export type CategoryRowConfig = {
    maxVisible?: number;
    showViewAll?: boolean;
    viewAllHref?: string | null;
    enableDrillDown?: boolean;
};

export const cmsHomeLayoutBlocks = pgTable("cms_home_layout_blocks", {
    id: uuid("id").primaryKey().defaultRandom(),
    type: cmsHomeBlockTypeEnum("type").notNull(),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    status: cmsStatusEnum("status").notNull().default("draft"),
    sortIndex: integer("sort_index").notNull().default(0),
    platforms: text("platforms")
        .array()
        .notNull()
        .default(sql`ARRAY['web','mobile']::text[]`),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    title: text("title"),
    subtitle: text("subtitle"),
    showTitle: boolean("show_title").notNull().default(true),
    showSubtitle: boolean("show_subtitle").notNull().default(true),
    sectionId: uuid("section_id").references(() => catalogSections.id, { onDelete: "set null" }),
    config: jsonb("config")
        .$type<CategoryRowConfig>()
        .notNull()
        .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cmsHomeBlockCategories = pgTable(
    "cms_home_block_categories",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        blockId: uuid("block_id")
            .notNull()
            .references(() => cmsHomeLayoutBlocks.id, { onDelete: "cascade" }),
        categoryId: uuid("category_id")
            .notNull()
            .references(() => categories.id, { onDelete: "cascade" }),
        sortIndex: integer("sort_index").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("cms_home_block_categories_block_category").on(table.blockId, table.categoryId)],
);

export type CmsHomeLayoutBlock = typeof cmsHomeLayoutBlocks.$inferSelect;
export type NewCmsHomeLayoutBlock = typeof cmsHomeLayoutBlocks.$inferInsert;
export type CmsHomeBlockCategory = typeof cmsHomeBlockCategories.$inferSelect;
