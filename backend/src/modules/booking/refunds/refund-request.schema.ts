import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";
import { orders, paymentMethodEnum } from "@/modules/booking/orders/order.schema.js";

export const REFUND_REQUEST_STATUSES = [
    "requested",
    "rejected",
    "processing",
    "completed",
] as const;

export type RefundRequestStatus = (typeof REFUND_REQUEST_STATUSES)[number];

export const refundRequestStatusEnum = pgEnum("refund_request_status", REFUND_REQUEST_STATUSES);

export const refundRequests = pgTable("refund_requests", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    amountPaise: integer("amount_paise").notNull(),
    reason: text("reason").notNull(),
    status: refundRequestStatusEnum("status").notNull().default("requested"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    adminNote: text("admin_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    gatewayRefundId: text("gateway_refund_id"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RefundRequest = typeof refundRequests.$inferSelect;
export type NewRefundRequest = typeof refundRequests.$inferInsert;
