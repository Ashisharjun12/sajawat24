import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";

export const paymentProviderEnum = pgEnum("payment_provider", ["razorpay", "cashfree"]);
export const paymentIntentStatusEnum = pgEnum("payment_intent_status", ["created", "paid", "failed"]);

export const paymentIntents = pgTable("payment_intents", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .unique()
        .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    providerRef: text("provider_ref").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    status: paymentIntentStatusEnum("status").notNull().default("created"),
    providerPaymentId: text("provider_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type NewPaymentIntent = typeof paymentIntents.$inferInsert;
