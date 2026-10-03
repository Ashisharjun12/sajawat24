import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { paymentProviderEnum } from "@/modules/payments/intents/payment-intent.schema.js";

export const collectionSessionStatusEnum = pgEnum("collection_session_status", [
    "created",
    "paid",
    "expired",
    "cancelled",
]);

export const collectionSessions = pgTable("collection_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    providerRef: text("provider_ref").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    status: collectionSessionStatusEnum("status").notNull().default("created"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    qrPayload: jsonb("qr_payload").$type<Record<string, unknown>>(),
    providerPaymentId: text("provider_payment_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CollectionSession = typeof collectionSessions.$inferSelect;
export type NewCollectionSession = typeof collectionSessions.$inferInsert;
