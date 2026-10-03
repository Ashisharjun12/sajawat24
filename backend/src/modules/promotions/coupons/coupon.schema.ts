import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cities } from "@/modules/geo/cities/city.schema.js";

export const couponTypeEnum = pgEnum("coupon_type", ["flat", "percent"]);
export const couponScopeEnum = pgEnum("coupon_scope", ["entire_cart", "products", "categories"]);

export const coupons = pgTable("coupons", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    type: couponTypeEnum("type").notNull(),
    valuePaise: integer("value_paise"),
    percentBps: integer("percent_bps"),
    maxDiscountPaise: integer("max_discount_paise"),
    minOrderPaise: integer("min_order_paise").notNull().default(0),
    maxUses: integer("max_uses").notNull(),
    maxUsesPerUser: integer("max_uses_per_user").notNull(),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    scope: couponScopeEnum("scope").notNull().default("entire_cart"),
    firstOrderOnly: boolean("first_order_only").notNull().default(false),
    allowedPaymentMethods: text("allowed_payment_methods")
        .array()
        .notNull()
        .default(sql`ARRAY['online','cod']::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
