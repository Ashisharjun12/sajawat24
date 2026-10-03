import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { products } from "@/modules/catalog/products/product.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

export const addonColors = pgTable(
    "addon_colors",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        hex: text("hex").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [uniqueIndex("addon_colors_name_lower_idx").on(sql`lower(${table.name})`)],
);

export const addons = pgTable("addons", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUploadId: uuid("image_upload_id").references(() => uploads.id, { onDelete: "set null" }),
    colorId: uuid("color_id").references(() => addonColors.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    pricePaise: integer("price_paise"),
    compareAtPaise: integer("compare_at_paise"),
    maxQuantity: integer("max_quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productAddons = pgTable(
    "product_addons",
    {
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        addonId: uuid("addon_id")
            .notNull()
            .references(() => addons.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [primaryKey({ columns: [table.productId, table.addonId] })],
);

export type AddonColor = typeof addonColors.$inferSelect;
export type NewAddonColor = typeof addonColors.$inferInsert;
export type Addon = typeof addons.$inferSelect;
export type NewAddon = typeof addons.$inferInsert;
export type ProductAddon = typeof productAddons.$inferSelect;
export type NewProductAddon = typeof productAddons.$inferInsert;
