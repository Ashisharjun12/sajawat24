import { integer, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";

export const cityPrices = pgTable(
    "city_prices",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        cityId: uuid("city_id")
            .notNull()
            .references(() => cities.id, { onDelete: "restrict" }),
        pricePaise: integer("price_paise").notNull(),
        compareAtPaise: integer("compare_at_paise"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("city_prices_product_city").on(table.productId, table.cityId)],
);

export const addonCityPrices = pgTable(
    "addon_city_prices",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        addonId: uuid("addon_id")
            .notNull()
            .references(() => addons.id, { onDelete: "cascade" }),
        cityId: uuid("city_id")
            .notNull()
            .references(() => cities.id, { onDelete: "restrict" }),
        pricePaise: integer("price_paise").notNull(),
        compareAtPaise: integer("compare_at_paise"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("addon_city_prices_addon_city").on(table.addonId, table.cityId)],
);

export type CityPrice = typeof cityPrices.$inferSelect;
export type NewCityPrice = typeof cityPrices.$inferInsert;
export type AddonCityPrice = typeof addonCityPrices.$inferSelect;
export type NewAddonCityPrice = typeof addonCityPrices.$inferInsert;
