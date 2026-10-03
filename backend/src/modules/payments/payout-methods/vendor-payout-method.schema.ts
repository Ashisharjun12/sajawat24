import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

export const vendorPayoutMethodTypeEnum = pgEnum("vendor_payout_method_type", ["bank", "upi"]);

export const vendorPayoutMethods = pgTable("vendor_payout_methods", {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendors.id, { onDelete: "restrict" }),
    type: vendorPayoutMethodTypeEnum("type").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    accountHolderName: text("account_holder_name").notNull(),
    bankName: text("bank_name"),
    accountNumberLast4: text("account_number_last4"),
    accountNumberEncrypted: text("account_number_encrypted"),
    ifsc: text("ifsc"),
    upiId: text("upi_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type VendorPayoutMethod = typeof vendorPayoutMethods.$inferSelect;
export type NewVendorPayoutMethod = typeof vendorPayoutMethods.$inferInsert;
