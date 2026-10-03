import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";

export const orderFinancials = pgTable("order_financials", {
    orderId: uuid("order_id")
        .primaryKey()
        .references(() => orders.id, { onDelete: "cascade" }),
    grossPaise: integer("gross_paise").notNull(),
    discountPaise: integer("discount_paise").notNull().default(0),
    platformPercentSnapshot: integer("platform_percent_snapshot").notNull(),
    platformFeePaise: integer("platform_fee_paise").notNull(),
    vendorSharePaise: integer("vendor_share_paise").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OrderFinancial = typeof orderFinancials.$inferSelect;
export type NewOrderFinancial = typeof orderFinancials.$inferInsert;
