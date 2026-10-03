import { integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

export const ledgerAccountEnum = pgEnum("ledger_account", [
    "platform_cash",
    "order_escrow",
    "vendor_pending",
    "vendor_payable",
    "vendor_cod_due",
    "platform_revenue",
]);

export const ledgerEntries = pgTable(
    "ledger_entries",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: uuid("order_id").references(() => orders.id, { onDelete: "restrict" }),
        vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "restrict" }),
        debitAccount: ledgerAccountEnum("debit_account").notNull(),
        creditAccount: ledgerAccountEnum("credit_account").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        idempotencyKey: text("idempotency_key").notNull(),
        metadata: jsonb("metadata").$type<Record<string, unknown>>(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [unique("ledger_entries_idempotency_key").on(table.idempotencyKey)],
);

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
export type LedgerAccount = (typeof ledgerAccountEnum.enumValues)[number];
