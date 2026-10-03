import { and, desc, eq, exists, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orderItems, orders } from "@/modules/booking/orders/order.schema.js";
import {
    refundRequests,
    type NewRefundRequest,
    type RefundRequest,
    type RefundRequestStatus,
} from "@/modules/booking/refunds/refund-request.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";

export type RefundAdminListFilter = {
    status?: RefundRequestStatus;
    userId?: string;
    q?: string;
};

export type RefundAdminListRow = {
    request: RefundRequest;
    orderRef: string;
    customerName: string;
    customerPhone: string | null;
};

const OPEN_STATUSES: RefundRequestStatus[] = ["requested", "processing"];

export class RefundRequestRepository {
    async insert(data: NewRefundRequest): Promise<RefundRequest> {
        const [row] = await db.insert(refundRequests).values(data).returning();
        if (!row) {
            throw new Error("failed to create refund request");
        }
        return row;
    }

    async findById(id: string): Promise<RefundRequest | undefined> {
        const [row] = await db.select().from(refundRequests).where(eq(refundRequests.id, id)).limit(1);
        return row;
    }

    async findOpenByOrderId(orderId: string): Promise<RefundRequest | undefined> {
        const [row] = await db
            .select()
            .from(refundRequests)
            .where(
                and(
                    eq(refundRequests.orderId, orderId),
                    inArray(refundRequests.status, OPEN_STATUSES),
                ),
            )
            .orderBy(desc(refundRequests.requestedAt))
            .limit(1);
        return row;
    }

    async findRequestedByOrderId(orderId: string): Promise<RefundRequest | undefined> {
        const [row] = await db
            .select()
            .from(refundRequests)
            .where(
                and(eq(refundRequests.orderId, orderId), eq(refundRequests.status, "requested")),
            )
            .limit(1);
        return row;
    }

    async hasCompletedForOrder(orderId: string): Promise<boolean> {
        const [row] = await db
            .select({ id: refundRequests.id })
            .from(refundRequests)
            .where(
                and(eq(refundRequests.orderId, orderId), eq(refundRequests.status, "completed")),
            )
            .limit(1);
        return Boolean(row);
    }

    async listByUser(userId: string, page: number, limit: number): Promise<{ items: RefundRequest[]; total: number }> {
        const where = eq(refundRequests.userId, userId);
        const [totalRow] = await db
            .select({ value: sql<number>`count(*)::int` })
            .from(refundRequests)
            .where(where);
        const items = await db
            .select()
            .from(refundRequests)
            .where(where)
            .orderBy(desc(refundRequests.requestedAt))
            .limit(limit)
            .offset((page - 1) * limit);
        return { items, total: totalRow?.value ?? 0 };
    }

    private adminListWhere(filter: RefundAdminListFilter): SQL | undefined {
        const parts: SQL[] = [];
        if (filter.status) {
            parts.push(eq(refundRequests.status, filter.status));
        }
        if (filter.userId) {
            parts.push(eq(refundRequests.userId, filter.userId));
        }
        const query = filter.q?.trim();
        if (query) {
            const term = `%${query}%`;
            parts.push(
                or(
                    ilike(orders.reference, term),
                    ilike(users.name, term),
                    ilike(users.phone, term),
                    ilike(users.email, term),
                    ilike(refundRequests.reason, term),
                    exists(
                        db
                            .select({ id: orderItems.id })
                            .from(orderItems)
                            .where(
                                and(
                                    eq(orderItems.orderId, refundRequests.orderId),
                                    ilike(orderItems.productName, term),
                                ),
                            ),
                    ),
                )!,
            );
        }
        if (parts.length === 0) return undefined;
        return parts.length === 1 ? parts[0] : and(...parts);
    }

    async listAdmin(
        page: number,
        limit: number,
        filter: RefundAdminListFilter = {},
    ): Promise<{ items: RefundAdminListRow[]; total: number }> {
        const where = this.adminListWhere(filter);
        const [totalRow] = await db
            .select({ value: sql<number>`count(*)::int` })
            .from(refundRequests)
            .innerJoin(orders, eq(refundRequests.orderId, orders.id))
            .innerJoin(users, eq(refundRequests.userId, users.id))
            .where(where);
        const rows = await db
            .select({
                request: refundRequests,
                orderRef: orders.reference,
                customerName: users.name,
                customerPhone: users.phone,
            })
            .from(refundRequests)
            .innerJoin(orders, eq(refundRequests.orderId, orders.id))
            .innerJoin(users, eq(refundRequests.userId, users.id))
            .where(where)
            .orderBy(desc(refundRequests.requestedAt))
            .limit(limit)
            .offset((page - 1) * limit);
        const items = rows.map((row) => ({
            request: row.request,
            orderRef: row.orderRef,
            customerName: row.customerName,
            customerPhone: row.customerPhone,
        }));
        return { items, total: totalRow?.value ?? 0 };
    }

    async findLatestByOrderId(orderId: string): Promise<RefundRequest | undefined> {
        const [row] = await db
            .select()
            .from(refundRequests)
            .where(eq(refundRequests.orderId, orderId))
            .orderBy(desc(refundRequests.requestedAt))
            .limit(1);
        return row;
    }

    async update(
        id: string,
        data: Partial<
            Pick<
                RefundRequest,
                | "status"
                | "adminNote"
                | "reviewedBy"
                | "gatewayRefundId"
                | "completedAt"
                | "updatedAt"
            >
        >,
    ): Promise<RefundRequest | undefined> {
        const [row] = await db
            .update(refundRequests)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(refundRequests.id, id))
            .returning();
        return row;
    }
}
