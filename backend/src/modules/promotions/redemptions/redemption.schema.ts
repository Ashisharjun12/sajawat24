import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { coupons } from "@/modules/promotions/coupons/coupon.schema.js";

export const couponRedemptions = pgTable("coupon_redemptions", {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
        .notNull()
        .references(() => coupons.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
        .notNull()
        .unique()
        .references(() => orders.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    discountPaise: integer("discount_paise").notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type NewCouponRedemption = typeof couponRedemptions.$inferInsert;
