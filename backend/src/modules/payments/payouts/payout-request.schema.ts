import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { vendorPayoutMethods } from "@/modules/payments/payout-methods/vendor-payout-method.schema.js";

export const payoutRequestStatusEnum = pgEnum("payout_request_status", [
    "pending",
    "processing",
    "paid",
    "failed",
    "cancelled",
]);

export const payoutRequests = pgTable("payout_requests", {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendors.id, { onDelete: "restrict" }),
    payoutMethodId: uuid("payout_method_id").references(() => vendorPayoutMethods.id, {
        onDelete: "set null",
    }),
    amountPaise: integer("amount_paise").notNull(),
    status: payoutRequestStatusEnum("status").notNull().default("pending"),
    provider: text("provider"),
    providerRef: text("provider_ref"),
    failureReason: text("failure_reason"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processedByAdminId: uuid("processed_by_admin_id").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type NewPayoutRequest = typeof payoutRequests.$inferInsert;
