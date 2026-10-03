import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { products } from "@/modules/catalog/products/product.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";

export const catalogSections = pgTable("catalog_sections", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sortIndex: integer("sort_index").notNull().default(0),
    badgeColor: text("badge_color").notNull().default("amber"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const catalogSectionCityOverrides = pgTable(
    "catalog_section_city_overrides",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sectionId: uuid("section_id")
            .notNull()
            .references(() => catalogSections.id, { onDelete: "cascade" }),
        cityId: uuid("city_id")
            .notNull()
            .references(() => cities.id, { onDelete: "restrict" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("catalog_section_city_overrides_section_city").on(table.sectionId, table.cityId)],
);

export const catalogSectionProducts = pgTable(
    "catalog_section_products",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sectionId: uuid("section_id")
            .notNull()
            .references(() => catalogSections.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        cityId: uuid("city_id").references(() => cities.id, { onDelete: "restrict" }),
        sortIndex: integer("sort_index").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("catalog_section_products_global_uniq")
            .on(table.sectionId, table.productId)
            .where(sql`${table.cityId} is null`),
        uniqueIndex("catalog_section_products_city_uniq")
            .on(table.sectionId, table.productId, table.cityId)
            .where(sql`${table.cityId} is not null`),
    ],
);

export type CatalogSection = typeof catalogSections.$inferSelect;
export type NewCatalogSection = typeof catalogSections.$inferInsert;
export type CatalogSectionCityOverride = typeof catalogSectionCityOverrides.$inferSelect;
export type CatalogSectionProduct = typeof catalogSectionProducts.$inferSelect;
