import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

export const vendorMemberKindEnum = pgEnum("vendor_member_kind", ["OWNER", "WORKER"]);

export const vendorMemberStatusEnum = pgEnum("vendor_member_status", [
    "invited",
    "active",
    "disabled",
]);

export const vendorMembers = pgTable(
    "vendor_members",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        vendorId: uuid("vendor_id")
            .notNull()
            .references(() => vendors.id, { onDelete: "cascade" }),
        userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
        invitedPhone: text("invited_phone").notNull(),
        displayName: text("display_name").notNull(),
        kind: vendorMemberKindEnum("kind").notNull().default("WORKER"),
        status: vendorMemberStatusEnum("status").notNull().default("invited"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("vendor_members_vendor_user_uidx").on(table.vendorId, table.userId),
        uniqueIndex("vendor_members_vendor_phone_uidx").on(table.vendorId, table.invitedPhone),
    ],
);

export type VendorMember = typeof vendorMembers.$inferSelect;
export type NewVendorMember = typeof vendorMembers.$inferInsert;
export type VendorMemberKind = VendorMember["kind"];
export type VendorMemberStatus = VendorMember["status"];
