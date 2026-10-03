import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

export const assignmentVendorResponseEnum = pgEnum("assignment_vendor_response", [
    "pending",
    "accepted",
    "declined",
]);

export const assignmentSourceEnum = pgEnum("assignment_source", ["admin", "system"]);

export const assignments = pgTable("assignments", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .unique()
        .references(() => orders.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendors.id, { onDelete: "restrict" }),
    assignedBy: uuid("assigned_by")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    vendorResponse: assignmentVendorResponseEnum("vendor_response").notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    source: assignmentSourceEnum("source").notNull().default("admin"),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type AssignmentVendorResponse = Assignment["vendorResponse"];
