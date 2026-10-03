import { pgEnum, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { coupons } from "@/modules/promotions/coupons/coupon.schema.js";

export const couponTargetTypeEnum = pgEnum("coupon_target_type", ["product", "category"]);

export const couponTargets = pgTable(
    "coupon_targets",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        couponId: uuid("coupon_id")
            .notNull()
            .references(() => coupons.id, { onDelete: "cascade" }),
        targetType: couponTargetTypeEnum("target_type").notNull(),
        targetId: uuid("target_id").notNull(),
    },
    (table) => [unique("coupon_targets_coupon_type_id").on(table.couponId, table.targetType, table.targetId)],
);

export type CouponTarget = typeof couponTargets.$inferSelect;
export type NewCouponTarget = typeof couponTargets.$inferInsert;
