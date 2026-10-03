import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

export type ProductFaq = {
    question: string;
    answer: string;
};

export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    categoryId: uuid("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
    scheduledEnabled: boolean("scheduled_enabled").notNull().default(true),
    instantEnabled: boolean("instant_enabled").notNull().default(false),
    instantShowBadge: boolean("instant_show_badge").notNull().default(true),
    instantBadgeLabel: text("instant_badge_label"),
    instantPdpNote: text("instant_pdp_note"),
    instantEtaMinutes: integer("instant_eta_minutes"),
    paymentCod: boolean("payment_cod").notNull().default(true),
    paymentOnline: boolean("payment_online").notNull().default(false),
    pricePaise: integer("price_paise"),
    compareAtPaise: integer("compare_at_paise"),
    includes: jsonb("includes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    deliverySetup: jsonb("delivery_setup").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    careInstructions: jsonb("care_instructions").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    faqs: jsonb("faqs").$type<ProductFaq[]>().notNull().default(sql`'[]'::jsonb`),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
    reviewCount: integer("review_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productImages = pgTable(
    "product_images",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        uploadId: uuid("upload_id")
            .notNull()
            .references(() => uploads.id, { onDelete: "restrict" }),
        sortIndex: integer("sort_index").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("product_images_product_upload").on(table.productId, table.uploadId)],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
