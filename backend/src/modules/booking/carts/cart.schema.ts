import { doublePrecision, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { fulfillmentTypeEnum } from "@/modules/booking/domain/geo-enums.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { coupons } from "@/modules/promotions/coupons/coupon.schema.js";

export const carts = pgTable(
    "carts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
        guestKey: text("guest_key").unique(),
        cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
        pincode: text("pincode"),
        fulfillmentType: fulfillmentTypeEnum("fulfillment_type"),
        deliveryLatitude: doublePrecision("delivery_latitude"),
        deliveryLongitude: doublePrecision("delivery_longitude"),
        scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
        appliedCouponId: uuid("applied_coupon_id").references(() => coupons.id, { onDelete: "set null" }),
        appliedCouponCode: text("applied_coupon_code"),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("carts_user_id_unique").on(table.userId)],
);

export const cartItems = pgTable(
    "cart_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        cartId: uuid("cart_id")
            .notNull()
            .references(() => carts.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        quantity: integer("quantity").notNull().default(1),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("cart_items_cart_product").on(table.cartId, table.productId)],
);

export const cartItemAddons = pgTable(
    "cart_item_addons",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        cartItemId: uuid("cart_item_id")
            .notNull()
            .references(() => cartItems.id, { onDelete: "cascade" }),
        addonId: uuid("addon_id")
            .notNull()
            .references(() => addons.id, { onDelete: "cascade" }),
        quantity: integer("quantity").notNull().default(1),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("cart_item_addons_item_addon").on(table.cartItemId, table.addonId)],
);

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type CartItemAddon = typeof cartItemAddons.$inferSelect;
export type NewCartItemAddon = typeof cartItemAddons.$inferInsert;
