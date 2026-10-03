import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { vendorMembers } from "@/modules/identity/vendor-members/vendor-member.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";

export const orderFieldAssignments = pgTable(
    "order_field_assignments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        vendorId: uuid("vendor_id")
            .notNull()
            .references(() => vendors.id, { onDelete: "cascade" }),
        memberId: uuid("member_id")
            .notNull()
            .references(() => vendorMembers.id, { onDelete: "cascade" }),
        assignedBy: uuid("assigned_by")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("order_field_assignments_order_member_uidx").on(table.orderId, table.memberId),
    ],
);

export type OrderFieldAssignment = typeof orderFieldAssignments.$inferSelect;
export type NewOrderFieldAssignment = typeof orderFieldAssignments.$inferInsert;
