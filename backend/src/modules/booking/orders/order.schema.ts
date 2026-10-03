import { boolean, doublePrecision, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { coupons } from "@/modules/promotions/coupons/coupon.schema.js";
import { ORDER_STATUSES } from "@/modules/booking/domain/order-status.js";
import {
    dispatchStatusEnum,
    fulfillmentTypeEnum,
    geoPointSourceEnum,
} from "@/modules/booking/domain/geo-enums.js";

export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);
export const paymentMethodEnum = pgEnum("payment_method", ["COD", "ONLINE", "PREPAID"]);
export const orderSourceEnum = pgEnum("order_source", ["web", "admin"]);
export const collectionStatusEnum = pgEnum("collection_status", [
    "not_required",
    "pending",
    "collected_cash",
    "collected_online",
]);
export const collectionMethodEnum = pgEnum("collection_method", ["cash", "online"]);

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        reference: text("reference").notNull().unique(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        status: orderStatusEnum("status").notNull(),
        paymentMethod: paymentMethodEnum("payment_method").notNull(),
        source: orderSourceEnum("source").notNull().default("web"),
        createdByAdminId: uuid("created_by_admin_id").references(() => users.id, {
            onDelete: "set null",
        }),
        adminNotes: text("admin_notes"),
        isCustomPackage: boolean("is_custom_package").notNull().default(false),
        cityId: uuid("city_id")
            .notNull()
            .references(() => cities.id, { onDelete: "restrict" }),
        pincode: text("pincode").notNull(),
        fulfillmentType: fulfillmentTypeEnum("fulfillment_type").notNull().default("scheduled"),
        dispatchStatus: dispatchStatusEnum("dispatch_status").notNull().default("idle"),
        dispatchExhaustedAt: timestamp("dispatch_exhausted_at", { withTimezone: true }),
        deliveryLatitude: doublePrecision("delivery_latitude"),
        deliveryLongitude: doublePrecision("delivery_longitude"),
        deliveryGeoSource: geoPointSourceEnum("delivery_geo_source"),
        deliveryGeoAt: timestamp("delivery_geo_at", { withTimezone: true }),
        scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
        subtotalPaise: integer("subtotal_paise").notNull(),
        discountPaise: integer("discount_paise").notNull().default(0),
        couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
        couponCode: text("coupon_code"),
        customerName: text("customer_name").notNull(),
        customerPhone: text("customer_phone").notNull(),
        customerEmail: text("customer_email").notNull(),
        addressLine: text("address_line").notNull(),
        landmark: text("landmark"),
        cityName: text("city_name").notNull(),
        idempotencyKey: text("idempotency_key"),
        collectionStatus: collectionStatusEnum("collection_status")
            .notNull()
            .default("not_required"),
        collectionMethod: collectionMethodEnum("collection_method"),
        collectedAt: timestamp("collected_at", { withTimezone: true }),
        ledgerPostedAt: timestamp("ledger_posted_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("orders_user_idempotency").on(table.userId, table.idempotencyKey)],
);

export const orderItems = pgTable("order_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    imageUrl: text("image_url"),
    quantity: integer("quantity").notNull(),
    productPaise: integer("product_paise").notNull(),
    addonsPaise: integer("addons_paise").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItemAddons = pgTable(
    "order_item_addons",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderItemId: uuid("order_item_id")
            .notNull()
            .references(() => orderItems.id, { onDelete: "cascade" }),
        addonId: uuid("addon_id")
            .notNull()
            .references(() => addons.id, { onDelete: "restrict" }),
        addonName: text("addon_name").notNull(),
        pricePaise: integer("price_paise").notNull(),
        quantity: integer("quantity").notNull().default(1),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("order_item_addons_item_addon").on(table.orderItemId, table.addonId)],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderItemAddon = typeof orderItemAddons.$inferSelect;
export type NewOrderItemAddon = typeof orderItemAddons.$inferInsert;
