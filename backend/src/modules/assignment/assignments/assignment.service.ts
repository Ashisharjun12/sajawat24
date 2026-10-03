import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { AssignCandidatesQuery, AssignVendorInput } from "@/modules/assignment/assignments/assignment.dto.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { VENDOR_JOB_ASSIGNED_EVENT } from "@/modules/assignment/lib/assignment.events.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { PublicOrder } from "@/modules/booking/orders/order.service.js";
import type { RealtimePort } from "@/infrastructure/realtime/realtime.port.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";
import { formatBookingSchedule } from "@/modules/notifications/templates/email/booking-confirmed.render.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { settingService } from "@/modules/ops/index.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import { logger } from "@/utils/logger.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import {
    isOrderCustomerConflictWithVendor,
    SELF_DEALING_CODE,
} from "@/modules/identity/consumer/self-dealing.js";

const BLOCKED_ASSIGN_STATUSES = new Set(["EN_ROUTE", "ON_SITE", "COMPLETED", "CANCELLED", "DISPUTED"]);

export interface IAssignmentService {
    listCandidates(orderId: string, query: AssignCandidatesQuery): Promise<{
        items: Array<{
            id: string;
            name: string;
            phone: string | null;
            pincode: string;
            cityName: string;
            rank: "same_pin" | "same_city";
            assignable: boolean;
            assignmentStatus?: "current" | "declined";
            dutyStatus: "online" | "offline";
        }>;
        total: number;
    }>;
    assign(
        orderId: string,
        input: AssignVendorInput,
        adminUserId: string,
        reloadOrder: (orderId: string) => Promise<PublicOrder>,
    ): Promise<PublicOrder>;
}

export class AssignmentService implements IAssignmentService {
    constructor(
        private readonly assignments: IAssignmentRepository,
        private readonly orders: IOrderRepository,
        private readonly vendors: IVendorRepository,
        private readonly notifications: INotificationService,
        private readonly realtime?: RealtimePort,
    ) {}

    async listCandidates(orderId: string, query: AssignCandidatesQuery) {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }

        const current = await this.assignments.findActiveByOrderId(orderId);
        const latest = current ?? (await this.assignments.findByOrderId(orderId));

        const result = await this.vendors.listAssignCandidates({
            cityId: order.cityId,
            deliveryPincode: order.pincode,
            search: query.q,
            samePin: query.samePin === "true",
            currentVendorId: current?.vendorId ?? null,
            currentVendorResponse: current?.vendorResponse ?? null,
            declinedVendorId:
                !current && latest?.vendorResponse === "declined" ? latest.vendorId : null,
        });

        return result;
    }

    async assign(
        orderId: string,
        input: AssignVendorInput,
        adminUserId: string,
        reloadOrder: (orderId: string) => Promise<PublicOrder>,
    ): Promise<PublicOrder> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (BLOCKED_ASSIGN_STATUSES.has(order.status)) {
            throw ApiError.badRequest("order cannot be assigned in its current status");
        }
        if (order.status !== "CONFIRMED" && order.status !== "ASSIGNED") {
            throw ApiError.badRequest("order cannot be assigned in its current status");
        }

        const vendor = await this.vendors.findById(input.vendorId);
        if (!vendor || vendor.onboardingStatus !== "ACTIVE") {
            throw ApiError.badRequest("vendor is not active");
        }
        if (vendor.cityId !== order.cityId) {
            throw ApiError.badRequest("vendor is not in the booking city");
        }
        if (!vendor.isOnDuty) {
            throw ApiError.conflict("vendor is offline");
        }

        const memberRepo = new VendorMemberRepository();
        if (
            await isOrderCustomerConflictWithVendor(order.userId, input.vendorId, {
                vendors: this.vendors,
                members: memberRepo,
            })
        ) {
            const err = ApiError.conflict("customer cannot be assigned to their own shop");
            err.code = SELF_DEALING_CODE;
            throw err;
        }

        const policy = await settingService.getPayoutPolicy();
        const codDue = await ledgerService.getVendorCodDue(input.vendorId);
        if (codDue > policy.codMaxDuePaise) {
            throw ApiError.conflict("vendor COD dues exceed platform limit");
        }

        const existing = await this.assignments.findActiveByOrderId(orderId);
        if (
            existing &&
            existing.vendorId === input.vendorId &&
            (existing.vendorResponse === "pending" || existing.vendorResponse === "accepted")
        ) {
            throw ApiError.conflict("already assigned to this vendor");
        }

        const previousVendorId = existing?.vendorId ?? null;
        const isReassign = Boolean(existing && previousVendorId !== input.vendorId);

        const assignment = await db.transaction(async (tx) => {
            if (order.status === "ASSIGNED") {
                const reverted = await this.orders.markConfirmed(orderId, tx);
                if (!reverted) {
                    throw ApiError.conflict("order could not be reassigned");
                }
            }

            return this.assignments.upsertForOrder(
                {
                    orderId,
                    vendorId: input.vendorId,
                    assignedBy: adminUserId,
                    vendorResponse: "pending",
                    source: "admin",
                },
                tx,
            );
        });

        await auditService.log({
            actorId: adminUserId,
            action: isReassign ? "order.vendor_reassigned" : "order.vendor_assigned",
            entityType: "order",
            entityId: orderId,
            summary: isReassign
                ? `Reassigned order ${order.reference} to vendor ${input.vendorId}`
                : `Assigned order ${order.reference} to vendor ${input.vendorId}`,
            before: {
                vendorId: previousVendorId,
                orderStatus: order.status,
            },
            after: {
                vendorId: input.vendorId,
                assignmentId: assignment.id,
            },
        });

        const assignedOrder = await reloadOrder(orderId);
        const vendorDetail = await this.vendors.findAdminDetail(input.vendorId);

        try {
            await this.notifications.notify({
                event: "VENDOR_NEW_JOB",
                userId: vendor.userId,
                recipient: { phone: vendorDetail?.phone ?? undefined },
                data: {
                    event: "VENDOR_NEW_JOB",
                    orderRef: assignedOrder.reference,
                    scheduledAt: formatBookingSchedule(assignedOrder.scheduledAt),
                    address: assignedOrder.delivery.address,
                    orderId: assignedOrder.id,
                },
                idempotencyKey: `vendor-new-job:${orderId}:${input.vendorId}:${assignment.id}`,
            });
        } catch (err) {
            logger.error({ err, orderId, vendorId: input.vendorId }, "vendor new job notify failed");
        }

        await this.publishJobAssigned(vendor.userId, assignedOrder.id);

        return assignedOrder;
    }

    private async publishJobAssigned(vendorUserId: string, orderId: string): Promise<void> {
        if (!this.realtime) return;
        try {
            await this.realtime.publish({
                userId: vendorUserId,
                event: VENDOR_JOB_ASSIGNED_EVENT,
                payload: { orderId },
            });
        } catch (err) {
            logger.error({ err, orderId, vendorUserId }, "vendor job assigned realtime publish failed");
        }
    }
}
