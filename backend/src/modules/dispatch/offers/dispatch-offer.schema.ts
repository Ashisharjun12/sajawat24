import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { dispatchOfferStatusEnum } from "@/modules/booking/domain/geo-enums.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

export const dispatchOffers = pgTable("dispatch_offers", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendors.id, { onDelete: "restrict" }),
    round: integer("round").notNull().default(1),
    distanceMeters: integer("distance_meters"),
    status: dispatchOfferStatusEnum("status").notNull().default("offered"),
    offeredAt: timestamp("offered_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DispatchOffer = typeof dispatchOffers.$inferSelect;
export type NewDispatchOffer = typeof dispatchOffers.$inferInsert;
