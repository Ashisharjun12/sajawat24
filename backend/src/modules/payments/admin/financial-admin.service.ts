import { and, count, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { db } from "@/db/postgres-client.js";
import {
    ORDER_STATUSES,
    type OrderStatus,
} from "@/modules/booking/domain/order-status.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { settingService } from "@/modules/ops/index.js";
import { LedgerEntryRepository } from "@/modules/payments/ledger/ledger-entry.repository.js";
import { PayoutRepository } from "@/modules/payments/payouts/payout.repository.js";
import {
    payoutRequests,
    type PayoutRequest,
} from "@/modules/payments/payouts/payout-request.schema.js";
import { notificationService } from "@/modules/notifications/index.js";
import { formatInrPaise } from "@/modules/notifications/lib/render.js";
import type { PayoutMethodAdminView } from "@/modules/payments/payout-methods/payout-method.service.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { payoutMethodService } from "@/modules/payments/payout-methods/payout-method.service.js";
import { walletService } from "@/modules/payments/wallets/wallet.service.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { paginationOffset, parsePagination, type Paginated } from "@/shared/http/pagination.js";
import { logger } from "@/utils/logger.js";

export class FinancialAdminService {
    private readonly entries = new LedgerEntryRepository();
    private readonly payouts = new PayoutRepository();

    async getOverview() {
        const policy = await settingService.getPayoutPolicy();
        const platformRevenuePaise = await this.entries.accountBalance(null, "platform_revenue");
        const orderEscrowPaise = await this.entries.accountBalance(null, "order_escrow");

        const [pendingPayoutsRow] = await db
            .select({ total: count() })
            .from(payoutRequests)
            .where(inArray(payoutRequests.status, ["pending", "processing"]));

        const activeVendors = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.onboardingStatus, "ACTIVE"));

        let totalCodDuesPaise = 0;
        for (const vendor of activeVendors) {
            const summary = await walletService.getSummary(vendor.id);
            totalCodDuesPaise += summary.codDuesPaise;
        }

        const [pendingCollectionRow] = await db
            .select({ total: count() })
            .from(orders)
            .where(
                and(eq(orders.paymentMethod, "COD"), eq(orders.collectionStatus, "pending")),
            );

        const [ledgerBacklogRow] = await db
            .select({ total: count() })
            .from(orders)
            .where(and(eq(orders.status, "COMPLETED"), isNull(orders.ledgerPostedAt)));

        return {
            platformRevenuePaise,
            orderEscrowPaise,
            totalCodDuesPaise,
            pendingPayoutRequests: Number(pendingPayoutsRow?.total ?? 0),
            pendingCodCollections: Number(pendingCollectionRow?.total ?? 0),
            ledgerBacklogCount: Number(ledgerBacklogRow?.total ?? 0),
            codMaxDuePaise: policy.codMaxDuePaise,
        };
    }

    async repostOrderLedger(orderId: string) {
        const [order] = await db
            .select({
                id: orders.id,
                reference: orders.reference,
                status: orders.status,
                ledgerPostedAt: orders.ledgerPostedAt,
            })
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) throw ApiError.notFound("order not found");
        if (order.status !== "COMPLETED") {
            throw ApiError.conflict("ledger can only be posted for completed orders");
        }

        const assignment = await new AssignmentRepository().findByOrderId(orderId);
        if (!assignment) throw ApiError.notFound("assignment not found for order");

        const posted = await ledgerService.postOnComplete(orderId, assignment.vendorId);
        const [updated] = await db
            .select({ ledgerPostedAt: orders.ledgerPostedAt })
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        return {
            orderId,
            orderReference: order.reference,
            posted,
            ledgerPostedAt: updated?.ledgerPostedAt?.toISOString() ?? null,
            vendorId: assignment.vendorId,
        };
    }

    async listVendorLiabilities(query: { q?: string; page?: number; limit?: number }) {
        const pagination = parsePagination(query);
        const offset = paginationOffset(pagination);
        const policy = await settingService.getPayoutPolicy();

        const filters = [eq(vendors.onboardingStatus, "ACTIVE")];
        const q = query.q?.trim();
        if (q) {
            const pattern = `%${q}%`;
            filters.push(
                or(ilike(users.name, pattern), ilike(users.phone, pattern))!,
            );
        }

        const whereClause = and(...filters);

        const [totalRow] = await db
            .select({ total: count() })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(whereClause);

        const rows = await db
            .select({
                id: vendors.id,
                name: users.name,
                phone: users.phone,
            })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(whereClause)
            .orderBy(desc(vendors.createdAt))
            .limit(pagination.limit)
            .offset(offset);

        const items = await Promise.all(
            rows.map(async (row) => {
                const wallet = await walletService.getSummary(row.id);
                const assignable = wallet.codDuesPaise <= policy.codMaxDuePaise;
                return {
                    vendorId: row.id,
                    name: row.name,
                    phone: row.phone,
                    ...wallet,
                    assignable,
                };
            }),
        );

        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total: Number(totalRow?.total ?? 0),
        };
    }

    async listPayoutRequests(query: {
        q?: string;
        status?: PayoutRequest["status"];
        page?: number;
        limit?: number;
    }): Promise<
        Paginated<{
            id: string;
            vendorId: string;
            vendorName: string;
            amountPaise: number;
            status: string;
            provider: string | null;
            createdAt: string;
        }>
    > {
        const pagination = parsePagination(query);
        const result = await this.payouts.list({
            q: query.q,
            status: query.status,
            limit: pagination.limit,
            offset: paginationOffset(pagination),
        });

        return {
            items: result.items,
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async listCodPendingOrders(query: {
        q?: string;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const pagination = parsePagination(query);
        const offset = paginationOffset(pagination);
        const filters = [
            eq(orders.paymentMethod, "COD"),
            eq(orders.collectionStatus, "pending"),
        ];

        const q = query.q?.trim();
        if (q) {
            const pattern = `%${q}%`;
            filters.push(
                or(
                    ilike(orders.reference, pattern),
                    ilike(orders.customerName, pattern),
                    ilike(orders.customerPhone, pattern),
                    ilike(orders.cityName, pattern),
                    ilike(orders.pincode, pattern),
                )!,
            );
        }

        const status = ORDER_STATUSES.includes(query.status as OrderStatus)
            ? (query.status as OrderStatus)
            : undefined;
        if (status) {
            filters.push(eq(orders.status, status));
        }

        const whereClause = and(...filters);

        const [totalRow] = await db
            .select({ total: count() })
            .from(orders)
            .where(whereClause);

        const rows = await db
            .select({
                id: orders.id,
                reference: orders.reference,
                status: orders.status,
                subtotalPaise: orders.subtotalPaise,
                customerName: orders.customerName,
                customerPhone: orders.customerPhone,
                cityName: orders.cityName,
                pincode: orders.pincode,
                scheduledAt: orders.scheduledAt,
            })
            .from(orders)
            .where(whereClause)
            .orderBy(desc(orders.scheduledAt))
            .limit(pagination.limit)
            .offset(offset);

        return {
            items: rows.map((row) => ({
                id: row.id,
                reference: row.reference,
                status: row.status,
                subtotalPaise: row.subtotalPaise,
                customerName: row.customerName,
                customerPhone: row.customerPhone,
                cityName: row.cityName,
                pincode: row.pincode,
                scheduledAt: row.scheduledAt.toISOString(),
            })),
            page: pagination.page,
            limit: pagination.limit,
            total: Number(totalRow?.total ?? 0),
        };
    }

    async getPayoutRequestDetail(id: string) {
        const request = await this.payouts.findById(id);
        if (!request) throw ApiError.notFound("payout request not found");

        const [vendorRow] = await db
            .select({
                vendorId: vendors.id,
                vendorName: users.name,
                vendorPhone: users.phone,
            })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(eq(vendors.id, request.vendorId))
            .limit(1);

        if (!vendorRow) throw ApiError.notFound("vendor not found");

        const wallet = await walletService.getSummary(request.vendorId);
        const payoutMethod = await payoutMethodService.getAdminView(request.payoutMethodId);

        return {
            id: request.id,
            vendorId: request.vendorId,
            vendorName: vendorRow.vendorName,
            vendorPhone: vendorRow.vendorPhone,
            amountPaise: request.amountPaise,
            status: request.status,
            provider: request.provider,
            failureReason: request.failureReason,
            createdAt: request.createdAt.toISOString(),
            processedAt: request.processedAt?.toISOString() ?? null,
            wallet,
            payoutMethod,
        };
    }

    async updatePayoutRequestStatus(
        id: string,
        input: {
            status: "processing" | "paid" | "failed";
            failureReason?: string;
            adminUserId: string;
        },
    ) {
        const request = await this.payouts.findById(id);
        if (!request) throw ApiError.notFound("payout request not found");

        const allowed: Record<string, PayoutRequest["status"][]> = {
            pending: ["processing", "paid", "failed"],
            processing: ["paid", "failed"],
        };
        const nextStatuses = allowed[request.status] ?? [];
        if (!nextStatuses.includes(input.status)) {
            throw ApiError.conflict(`cannot move payout from ${request.status} to ${input.status}`);
        }

        if (input.status === "failed") {
            await ledgerService.reverseWithdrawal(
                request.vendorId,
                request.id,
                input.failureReason ?? "admin marked failed",
            );
        }

        const updated = await this.payouts.updateStatus(id, {
            status: input.status,
            failureReason: input.status === "failed" ? input.failureReason ?? "failed" : null,
            processedAt: input.status === "paid" || input.status === "failed" ? new Date() : null,
            processedByAdminId: input.adminUserId,
        });
        if (!updated) throw ApiError.internalServerError("failed to update payout request");

        if (input.status === "paid" || input.status === "failed") {
            try {
                await this.notifyVendorPayoutStatus(updated, input.status, updated.failureReason);
            } catch (err) {
                logger.error(
                    { err, payoutRequestId: updated.id, status: input.status },
                    "payout status notify failed",
                );
            }
        }

        return {
            id: updated.id,
            status: updated.status,
            failureReason: updated.failureReason,
            processedAt: updated.processedAt?.toISOString() ?? null,
        };
    }

    private formatPayoutDestination(method: PayoutMethodAdminView | null): string {
        if (!method) return "your linked account";
        if (method.type === "upi") return method.upiId ?? "UPI account";
        const last4 = method.accountNumberLast4 ?? "";
        return `${method.bankName ?? "Bank"} · •••• ${last4}`;
    }

    private async notifyVendorPayoutStatus(
        request: PayoutRequest,
        status: "paid" | "failed",
        failureReason: string | null,
    ): Promise<void> {
        const [vendorRow] = await db
            .select({
                userId: vendors.userId,
                vendorName: users.name,
                vendorPhone: users.phone,
                vendorEmail: users.email,
            })
            .from(vendors)
            .innerJoin(users, eq(vendors.userId, users.id))
            .where(eq(vendors.id, request.vendorId))
            .limit(1);

        if (!vendorRow) return;

        const payoutMethod = await payoutMethodService.getAdminView(request.payoutMethodId);
        const event = status === "paid" ? "PAYOUT_PAID" : "PAYOUT_FAILED";
        const amountFormatted = formatInrPaise(request.amountPaise);
        const payoutDestination = this.formatPayoutDestination(payoutMethod);
        const resolvedFailureReason =
            failureReason?.trim() || "Please contact support for more details.";

        await notificationService.notify({
            event,
            userId: vendorRow.userId,
            recipient: {
                phone: vendorRow.vendorPhone,
                email: vendorRow.vendorEmail,
            },
            data: {
                event,
                vendorName: vendorRow.vendorName,
                amountFormatted,
                amountPaise: String(request.amountPaise),
                payoutRequestId: request.id,
                payoutDestination,
                failureReason: status === "failed" ? resolvedFailureReason : "",
            },
            idempotencyKey: `payout-${status}:${request.id}`,
        });
    }
}

export const financialAdminService = new FinancialAdminService();
