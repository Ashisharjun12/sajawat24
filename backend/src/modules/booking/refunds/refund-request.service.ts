import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { orderPayablePaise } from "@/modules/booking/orders/order-totals.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { RefundRequestStatus } from "@/modules/booking/refunds/refund-request.schema.js";
import { RefundRequestRepository } from "@/modules/booking/refunds/refund-request.repository.js";
import {
    toAdminRefundRequest,
    toPublicRefundRequest,
    type AdminRefundRequest,
    type PublicRefundRequest,
} from "@/modules/booking/refunds/refund-request.public.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";
import { refundExecutionService } from "@/modules/booking/refunds/refund-execution.service.js";

const ELIGIBLE_ORDER_STATUSES = new Set(["CANCELLED", "DISPUTED"]);

export class RefundRequestService {
    constructor(
        private readonly refunds = new RefundRequestRepository(),
        private readonly orders = new OrderRepository(),
        private readonly users = new UserRepository(),
    ) {}

    private async orderMeta(orderId: string) {
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }
        const primary = loaded.items[0];
        return {
            orderRef: loaded.reference,
            productName: primary?.productName ?? "Decoration booking",
            imageUrl: primary?.imageUrl ?? null,
        };
    }

    private async toPublic(row: Awaited<ReturnType<RefundRequestRepository["findById"]>>) {
        if (!row) {
            throw ApiError.notFound("refund request not found");
        }
        const meta = await this.orderMeta(row.orderId);
        return toPublicRefundRequest(row, meta);
    }

    async listForUser(
        userId: string,
        query: { page?: unknown; limit?: unknown },
    ): Promise<{ items: PublicRefundRequest[]; page: number; limit: number; total: number }> {
        const pagination = parsePagination(query);
        const { items, total } = await this.refunds.listByUser(userId, pagination.page, pagination.limit);
        const enriched = await Promise.all(
            items.map(async (row) => {
                const meta = await this.orderMeta(row.orderId);
                return toPublicRefundRequest(row, meta);
            }),
        );
        return {
            items: enriched,
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async createForOrder(userId: string, orderId: string, reason: string): Promise<PublicRefundRequest> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (!ELIGIBLE_ORDER_STATUSES.has(order.status)) {
            throw ApiError.badRequest("refunds are only available for cancelled or disputed bookings");
        }
        if (await this.refunds.hasCompletedForOrder(orderId)) {
            throw ApiError.conflict("this order already has a completed refund");
        }
        const open = await this.refunds.findOpenByOrderId(orderId);
        if (open) {
            throw ApiError.conflict("a refund request is already in progress for this order");
        }
        const existingRequested = await this.refunds.findRequestedByOrderId(orderId);
        if (existingRequested) {
            throw ApiError.conflict("a refund request is already pending for this order");
        }

        const row = await this.refunds.insert({
            orderId,
            userId,
            amountPaise: orderPayablePaise(order),
            reason: reason.trim(),
            paymentMethod: order.paymentMethod,
            status: "requested",
        });
        const meta = await this.orderMeta(orderId);
        return toPublicRefundRequest(row, meta);
    }

    async getLatestForOrder(orderId: string, userId?: string): Promise<PublicRefundRequest | null> {
        const order = userId
            ? await this.orders.findByIdForUser(orderId, userId)
            : await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        const row = await this.refunds.findLatestByOrderId(orderId);
        if (!row) return null;
        const meta = await this.orderMeta(orderId);
        return toPublicRefundRequest(row, meta);
    }

    private async toAdminPublic(
        row: NonNullable<Awaited<ReturnType<RefundRequestRepository["findById"]>>>,
        customer?: { name: string; phone: string | null },
    ): Promise<AdminRefundRequest> {
        const meta = await this.orderMeta(row.orderId);
        let customerName = customer?.name;
        let customerPhone = customer?.phone ?? null;
        if (!customerName) {
            const user = await this.users.findById(row.userId);
            customerName = user?.name ?? "Customer";
            customerPhone = user?.phone ?? null;
        }
        return toAdminRefundRequest(row, {
            orderRef: meta.orderRef,
            productName: meta.productName,
            imageUrl: meta.imageUrl,
            customerName,
            customerPhone,
        });
    }

    async listAdmin(query: {
        page?: unknown;
        limit?: unknown;
        status?: unknown;
        userId?: unknown;
        q?: unknown;
    }): Promise<{ items: AdminRefundRequest[]; page: number; limit: number; total: number }> {
        const pagination = parsePagination(query);
        const status =
            typeof query.status === "string" &&
            ["requested", "rejected", "processing", "completed"].includes(query.status)
                ? (query.status as RefundRequestStatus)
                : undefined;
        const userId = typeof query.userId === "string" ? query.userId : undefined;
        const q = typeof query.q === "string" ? query.q.trim() : undefined;
        const { items, total } = await this.refunds.listAdmin(pagination.page, pagination.limit, {
            status,
            userId,
            q: q || undefined,
        });
        const enriched = await Promise.all(
            items.map(async (row) => {
                const meta = await this.orderMeta(row.request.orderId);
                return toAdminRefundRequest(row.request, {
                    orderRef: row.orderRef,
                    productName: meta.productName,
                    imageUrl: meta.imageUrl,
                    customerName: row.customerName,
                    customerPhone: row.customerPhone,
                });
            }),
        );
        return {
            items: enriched,
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getAdmin(id: string): Promise<AdminRefundRequest> {
        const row = await this.refunds.findById(id);
        if (!row) {
            throw ApiError.notFound("refund request not found");
        }
        return this.toAdminPublic(row);
    }

    async getLatestForOrderAdmin(orderId: string): Promise<AdminRefundRequest | null> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        const row = await this.refunds.findLatestByOrderId(orderId);
        if (!row) return null;
        return this.toAdminPublic(row);
    }

    async patchAdmin(
        id: string,
        adminUserId: string,
        action: "approve" | "reject" | "complete",
        adminNote?: string,
    ): Promise<PublicRefundRequest> {
        const row = await this.refunds.findById(id);
        if (!row) {
            throw ApiError.notFound("refund request not found");
        }

        if (action === "reject") {
            if (row.status !== "requested") {
                throw ApiError.conflict("only pending requests can be rejected");
            }
            const updated = await this.refunds.update(id, {
                status: "rejected",
                adminNote: adminNote ?? null,
                reviewedBy: adminUserId,
            });
            return this.toPublic(updated);
        }

        if (action === "complete") {
            if (row.status !== "processing") {
                throw ApiError.conflict("only processing refunds can be marked completed");
            }
            const updated = await this.refunds.update(id, {
                status: "completed",
                completedAt: new Date(),
                reviewedBy: adminUserId,
                adminNote: adminNote ?? row.adminNote,
            });
            return this.toPublic(updated);
        }

        if (row.status !== "requested") {
            throw ApiError.conflict("only pending requests can be approved");
        }

        const canOnline = await refundExecutionService.canRefundOnline(row.orderId);
        if (canOnline) {
            const result = await refundExecutionService.executeOrderRefund(
                row.orderId,
                adminNote ?? `Refund approved for request ${id}`,
            );
            const updated = await this.refunds.update(id, {
                status: "completed",
                completedAt: new Date(),
                reviewedBy: adminUserId,
                adminNote: adminNote ?? null,
                gatewayRefundId: result.gatewayRefunded ? result.idempotencyKey : null,
            });
            return this.toPublic(updated);
        }

        const updated = await this.refunds.update(id, {
            status: "processing",
            reviewedBy: adminUserId,
            adminNote: adminNote ?? null,
        });
        return this.toPublic(updated);
    }
}
