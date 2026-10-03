import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    assignments,
    type Assignment,
    type AssignmentVendorResponse,
    type NewAssignment,
} from "@/modules/assignment/assignments/assignment.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AssigneeDetail = {
    id: string;
    name: string;
    phone: string | null;
    pincode: string;
    cityName: string;
    vendorResponse: AssignmentVendorResponse;
};

export interface IAssignmentRepository {
    findByOrderId(orderId: string): Promise<Assignment | undefined>;
    findActiveByOrderId(orderId: string): Promise<Assignment | undefined>;
    upsertForOrder(input: NewAssignment, tx?: DbTx): Promise<Assignment>;
    respondToAssignment(
        assignmentId: string,
        vendorId: string,
        response: "accepted" | "declined",
        tx?: DbTx,
    ): Promise<Assignment | undefined>;
    findAssigneeByOrderId(orderId: string): Promise<AssigneeDetail | undefined>;
    findAssigneeForAdminByOrderId(orderId: string): Promise<AssigneeDetail | undefined>;
    findAssigneesByOrderIds(orderIds: string[]): Promise<Map<string, AssigneeDetail>>;
}

export class AssignmentRepository implements IAssignmentRepository {
    async findByOrderId(orderId: string): Promise<Assignment | undefined> {
        const [row] = await db
            .select()
            .from(assignments)
            .where(eq(assignments.orderId, orderId))
            .limit(1);
        return row;
    }

    async findActiveByOrderId(orderId: string): Promise<Assignment | undefined> {
        const [row] = await db
            .select()
            .from(assignments)
            .where(
                and(
                    eq(assignments.orderId, orderId),
                    inArray(assignments.vendorResponse, ["pending", "accepted"]),
                    isNull(assignments.supersededAt),
                ),
            )
            .limit(1);
        return row;
    }

    async upsertForOrder(input: NewAssignment, tx?: DbTx): Promise<Assignment> {
        const client = tx ?? db;
        const [existing] = await client
            .select()
            .from(assignments)
            .where(eq(assignments.orderId, input.orderId))
            .limit(1);
        if (existing) {
            const [row] = await client
                .update(assignments)
                .set({
                    vendorId: input.vendorId,
                    assignedBy: input.assignedBy,
                    vendorResponse: input.vendorResponse ?? "pending",
                    respondedAt: null,
                    source: input.source ?? "admin",
                    supersededAt: null,
                    updatedAt: new Date(),
                })
                .where(eq(assignments.orderId, input.orderId))
                .returning();
            if (!row) throw new Error("failed to update assignment");
            return row;
        }
        const [row] = await client.insert(assignments).values(input).returning();
        if (!row) throw new Error("failed to create assignment");
        return row;
    }

    async respondToAssignment(
        assignmentId: string,
        vendorId: string,
        response: "accepted" | "declined",
        tx?: DbTx,
    ): Promise<Assignment | undefined> {
        const client = tx ?? db;
        const [row] = await client
            .update(assignments)
            .set({
                vendorResponse: response,
                respondedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(assignments.id, assignmentId),
                    eq(assignments.vendorId, vendorId),
                    eq(assignments.vendorResponse, "pending"),
                    isNull(assignments.supersededAt),
                ),
            )
            .returning();
        return row;
    }

    async findAssigneeByOrderId(orderId: string): Promise<AssigneeDetail | undefined> {
        const map = await this.findAssigneesByOrderIds([orderId]);
        return map.get(orderId);
    }

    async findAssigneeForAdminByOrderId(orderId: string): Promise<AssigneeDetail | undefined> {
        const [row] = await db
            .select({
                orderId: assignments.orderId,
                id: vendors.id,
                name: users.name,
                phone: users.phone,
                pincode: vendors.pincode,
                cityName: cities.name,
                vendorResponse: assignments.vendorResponse,
            })
            .from(assignments)
            .innerJoin(vendors, eq(assignments.vendorId, vendors.id))
            .innerJoin(users, eq(vendors.userId, users.id))
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .where(and(eq(assignments.orderId, orderId), isNull(assignments.supersededAt)))
            .limit(1);
        if (!row) return undefined;
        return {
            id: row.id,
            name: row.name,
            phone: row.phone,
            pincode: row.pincode,
            cityName: row.cityName,
            vendorResponse: row.vendorResponse,
        };
    }

    async findAssigneesByOrderIds(orderIds: string[]): Promise<Map<string, AssigneeDetail>> {
        const result = new Map<string, AssigneeDetail>();
        if (!orderIds.length) return result;

        const rows = await db
            .select({
                orderId: assignments.orderId,
                id: vendors.id,
                name: users.name,
                phone: users.phone,
                pincode: vendors.pincode,
                cityName: cities.name,
                vendorResponse: assignments.vendorResponse,
            })
            .from(assignments)
            .innerJoin(vendors, eq(assignments.vendorId, vendors.id))
            .innerJoin(users, eq(vendors.userId, users.id))
            .innerJoin(cities, eq(vendors.cityId, cities.id))
            .where(
                and(
                    inArray(assignments.orderId, orderIds),
                    inArray(assignments.vendorResponse, ["pending", "accepted"]),
                    isNull(assignments.supersededAt),
                ),
            );

        for (const row of rows) {
            result.set(row.orderId, {
                id: row.id,
                name: row.name,
                phone: row.phone,
                pincode: row.pincode,
                cityName: row.cityName,
                vendorResponse: row.vendorResponse,
            });
        }
        return result;
    }
}
