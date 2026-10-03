import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orderFieldAssignments } from "@/modules/assignment/field-assignments/order-field-assignment.schema.js";
import { vendorMembers } from "@/modules/identity/vendor-members/vendor-member.schema.js";

export type FieldAssignmentWithMember = {
    id: string;
    orderId: string;
    memberId: string;
    displayName: string;
    kind: "OWNER" | "WORKER";
    userId: string | null;
};

export interface IOrderFieldAssignmentRepository {
    listForOrder(vendorId: string, orderId: string): Promise<FieldAssignmentWithMember[]>;
    listOrderIdsForMember(memberId: string): Promise<string[]>;
    isMemberAssigned(memberId: string, orderId: string): Promise<boolean>;
    replaceForOrder(
        vendorId: string,
        orderId: string,
        memberIds: string[],
        assignedBy: string,
    ): Promise<FieldAssignmentWithMember[]>;
    deleteForOrder(orderId: string): Promise<void>;
}

export class OrderFieldAssignmentRepository implements IOrderFieldAssignmentRepository {
    async listForOrder(vendorId: string, orderId: string): Promise<FieldAssignmentWithMember[]> {
        const rows = await db
            .select({
                id: orderFieldAssignments.id,
                orderId: orderFieldAssignments.orderId,
                memberId: orderFieldAssignments.memberId,
                displayName: vendorMembers.displayName,
                kind: vendorMembers.kind,
                userId: vendorMembers.userId,
            })
            .from(orderFieldAssignments)
            .innerJoin(vendorMembers, eq(orderFieldAssignments.memberId, vendorMembers.id))
            .where(
                and(
                    eq(orderFieldAssignments.orderId, orderId),
                    eq(orderFieldAssignments.vendorId, vendorId),
                ),
            );
        return rows;
    }

    async listOrderIdsForMember(memberId: string): Promise<string[]> {
        const rows = await db
            .select({ orderId: orderFieldAssignments.orderId })
            .from(orderFieldAssignments)
            .where(eq(orderFieldAssignments.memberId, memberId));
        return rows.map((r) => r.orderId);
    }

    async isMemberAssigned(memberId: string, orderId: string): Promise<boolean> {
        const [row] = await db
            .select({ id: orderFieldAssignments.id })
            .from(orderFieldAssignments)
            .where(
                and(
                    eq(orderFieldAssignments.memberId, memberId),
                    eq(orderFieldAssignments.orderId, orderId),
                ),
            )
            .limit(1);
        return Boolean(row);
    }

    async replaceForOrder(
        vendorId: string,
        orderId: string,
        memberIds: string[],
        assignedBy: string,
    ): Promise<FieldAssignmentWithMember[]> {
        await db
            .delete(orderFieldAssignments)
            .where(
                and(
                    eq(orderFieldAssignments.orderId, orderId),
                    eq(orderFieldAssignments.vendorId, vendorId),
                ),
            );
        if (memberIds.length === 0) {
            return [];
        }
        await db.insert(orderFieldAssignments).values(
            memberIds.map((memberId) => ({
                orderId,
                vendorId,
                memberId,
                assignedBy,
            })),
        );
        return this.listForOrder(vendorId, orderId);
    }

    async deleteForOrder(orderId: string): Promise<void> {
        await db.delete(orderFieldAssignments).where(eq(orderFieldAssignments.orderId, orderId));
    }

    async findUserIdsForOrder(orderId: string): Promise<string[]> {
        const rows = await db
            .select({ userId: vendorMembers.userId })
            .from(orderFieldAssignments)
            .innerJoin(vendorMembers, eq(orderFieldAssignments.memberId, vendorMembers.id))
            .where(eq(orderFieldAssignments.orderId, orderId));
        return rows.map((r) => r.userId).filter((id): id is string => Boolean(id));
    }
}
