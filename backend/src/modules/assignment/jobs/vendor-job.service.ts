import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { Order } from "@/modules/booking/orders/order.schema.js";
import type { PublicOrder } from "@/modules/booking/orders/order.service.js";
import { assertTransition } from "@/modules/booking/domain/order-status.js";
import {
    assertDeliveryCodeSendRateLimit,
    consumeDeliveryCode,
    generateDeliveryCode,
    hasDeliveryCodePending,
    saveDeliveryCode,
} from "@/modules/booking/delivery/delivery-code.store.js";
import { BOOKING_STATUS_EVENT } from "@/modules/booking/lib/booking.events.js";
import {
    VENDOR_JOB_ASSIGNED_EVENT,
    VENDOR_JOB_UPDATED_EVENT,
} from "@/modules/assignment/lib/assignment.events.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";
import { cancelBookingReminders } from "@/modules/assignment/jobs/assignment-reminder.service.js";
import { bookingTrackUrl } from "@/modules/notifications/lib/render.js";
import { formatBookingSchedule } from "@/modules/notifications/templates/email/booking-confirmed.render.js";
import type { RealtimePort } from "@/infrastructure/realtime/realtime.port.js";
import type { PaginationQuery } from "@/shared/http/pagination.js";
import { buildBullJobId } from "@/infrastructure/queue/bull-job-id.js";
import { logger } from "@/utils/logger.js";
import type { IVendorJobRepository, VendorJobRow } from "@/modules/assignment/jobs/vendor-job.repository.js";
import type { IBookingChatService } from "@/modules/chat/services/booking-chat.service.js";
import type { PartnerContext } from "@/modules/identity/partner/partner-context.js";
import {
    OrderFieldAssignmentRepository,
    type FieldAssignmentWithMember,
} from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import {
    isOrderCustomerConflictWithVendor,
    SELF_DEALING_CODE,
} from "@/modules/identity/consumer/self-dealing.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { orderFinancialService } from "@/modules/payments/order-financials/order-financial.service.js";
import { ledgerService } from "@/modules/payments/ledger/ledger.service.js";
import {
    assignedFieldWorkerUserId,
    isDistinctFieldWorkerAssigned,
} from "@/modules/booking/lib/booking-field-chat.js";
import { buildOrderTripRoute } from "@/modules/maps/order-route.service.js";
import type { RouteResult } from "@/modules/maps/maps.types.js";
import {
    buildOrderTracking,
    type PublicOrderTracking,
} from "@/modules/dispatch/tracking/tracking.service.js";

export type VendorJobSummary = {
    id: string;
    orderRef: string;
    packageName: string;
    customerName: string;
    area: string;
    slotLabel: string;
    scheduledAt: string;
    status: string;
    paymentMethod: string;
    subtotalPaise: number;
    itemCount: number;
    needsAction: boolean;
    vendorResponse: "pending" | "accepted" | "declined";
    primaryImageUrl: string | null;
};

export type VendorJobDetail = VendorJobSummary & {
    addressLine: string;
    customer: { name: string; phone: string };
    delivery: {
        address: string;
        landmark: string | null;
        cityName: string;
        pincode: string;
        latitude: number | null;
        longitude: number | null;
    };
    items: Array<{
        id: string;
        name: string;
        imageUrl: string | null;
        quantity: number;
        productPaise: number;
        addonsPaise: number;
        lineTotalPaise: number;
        addons: Array<{ id: string; name: string; quantity: number; pricePaise: number }>;
    }>;
    canChat: boolean;
    deliveryCodeSent: boolean;
    collectionStatus: string;
    collectionMethod: string | null;
    requiresCollection: boolean;
    vendorSharePaise: number | null;
    platformFeePaise: number | null;
};

export interface IVendorJobService {
    listJobs(
        partner: PartnerContext,
        filter: "today" | "upcoming" | "completed" | "action" | undefined,
        pagination: PaginationQuery,
        search?: string,
    ): Promise<{ items: VendorJobSummary[]; total: number }>;
    getJob(partner: PartnerContext, orderId: string): Promise<VendorJobDetail>;
    getJobRoute(partner: PartnerContext, orderId: string): Promise<RouteResult>;
    getJobTracking(partner: PartnerContext, orderId: string): Promise<PublicOrderTracking>;
    acceptJob(partner: PartnerContext, orderId: string): Promise<VendorJobDetail>;
    declineJob(partner: PartnerContext, orderId: string): Promise<void>;
    postJobLocation(
        partner: PartnerContext,
        orderId: string,
        input: { latitude: number; longitude: number; heading?: number; speed?: number },
    ): Promise<{ suggestOnSite: boolean }>;
    markEnRoute(partner: PartnerContext, orderId: string): Promise<VendorJobDetail>;
    markOnSite(partner: PartnerContext, orderId: string): Promise<VendorJobDetail>;
    sendDeliveryCode(partner: PartnerContext, orderId: string): Promise<VendorJobDetail>;
    completeJob(partner: PartnerContext, orderId: string, code: string): Promise<VendorJobDetail>;
    listFieldAssignments(partner: PartnerContext, orderId: string): Promise<FieldAssignmentWithMember[]>;
    setFieldAssignments(
        partner: PartnerContext,
        orderId: string,
        memberIds: string[],
    ): Promise<FieldAssignmentWithMember[]>;
    assignSelfToJob(partner: PartnerContext, orderId: string): Promise<FieldAssignmentWithMember[]>;
}

function toSummary(row: VendorJobRow): VendorJobSummary {
    const addressParts = [row.cityName, row.pincode].filter(Boolean);
    return {
        id: row.orderId,
        orderRef: row.reference,
        packageName: row.primaryName || "Decoration package",
        customerName: row.customerName,
        area: addressParts.join(" · "),
        slotLabel: formatBookingSchedule(row.scheduledAt.toISOString()),
        scheduledAt: row.scheduledAt.toISOString(),
        status: row.status,
        paymentMethod: row.paymentMethod,
        subtotalPaise: row.subtotalPaise,
        itemCount: row.itemCount,
        needsAction: row.vendorResponse === "pending",
        vendorResponse: row.vendorResponse,
        primaryImageUrl: row.primaryImageUrl,
    };
}

const TRIP_BLOCKED_STATUSES = new Set(["CANCELLED", "COMPLETED", "DISPUTED"]);

export class VendorJobService implements IVendorJobService {
    private readonly fieldAssignments = new OrderFieldAssignmentRepository();
    private readonly vendorMembers = new VendorMemberRepository();

    constructor(
        private readonly jobs: IVendorJobRepository,
        private readonly vendors: IVendorRepository,
        private readonly assignments: IAssignmentRepository,
        private readonly orders: IOrderRepository,
        private readonly notifications: INotificationService,
        private readonly reloadOrder: (orderId: string) => Promise<PublicOrder>,
        private readonly users: IUserRepository,
        private readonly bookingChat?: IBookingChatService,
        private readonly realtime?: RealtimePort,
    ) {}

    private assertOwnerMode(partner: PartnerContext) {
        if (partner.mode !== "owner" || !partner.isShopOwner) {
            throw ApiError.forbidden("owner mode required");
        }
    }

    private async assertFieldModeJob(partner: PartnerContext, orderId: string) {
        if (partner.mode !== "field") {
            throw ApiError.forbidden("switch to worker mode to perform this action");
        }
        const vendor = await this.vendors.findById(partner.vendorId);
        if (!vendor?.isOnDuty) {
            throw ApiError.conflict("shop is offline");
        }
        const assigned = await this.fieldAssignments.isMemberAssigned(partner.memberId, orderId);
        if (!assigned) {
            throw ApiError.forbidden("job not assigned to you");
        }
    }

    private async assertActiveVendorJob(vendorId: string, orderId: string): Promise<Order> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (TRIP_BLOCKED_STATUSES.has(order.status)) {
            throw ApiError.conflict(`order is ${order.status.toLowerCase()}`);
        }

        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (
            !assignment ||
            assignment.vendorId !== vendorId ||
            assignment.vendorResponse !== "accepted"
        ) {
            throw ApiError.conflict("job is not active for this vendor");
        }

        return order;
    }

    private async resolveCanChat(
        partner: PartnerContext,
        vendorId: string,
        orderId: string,
        row: VendorJobRow,
    ): Promise<boolean> {
        if (
            row.vendorResponse !== "accepted" ||
            row.status === "COMPLETED" ||
            row.status === "CANCELLED"
        ) {
            return false;
        }
        if (partner.mode === "field") {
            if (!partner.memberId) return false;
            return this.fieldAssignments.isMemberAssigned(partner.memberId, orderId);
        }
        const vendor = await this.vendors.findById(vendorId);
        if (!vendor) return false;
        const workerUserId = await assignedFieldWorkerUserId(
            this.fieldAssignments,
            vendorId,
            orderId,
        );
        if (isDistinctFieldWorkerAssigned(vendor.userId, workerUserId)) {
            return false;
        }
        return true;
    }

    private async buildJobDetail(
        partner: PartnerContext,
        vendorId: string,
        orderId: string,
        row: VendorJobRow,
    ): Promise<VendorJobDetail> {
        const items = await this.jobs.loadOrderItems(orderId);
        const summary = toSummary(row);
        const deliveryAddress = [row.addressLine, row.landmark].filter(Boolean).join(", ");
        const deliveryCodeSent = await hasDeliveryCodePending(orderId);
        const order = await this.orders.findById(orderId);
        const collectionStatus = order?.collectionStatus ?? "not_required";
        const collectionMethod = order?.collectionMethod ?? null;
        const requiresCollection =
            order?.paymentMethod === "COD" && collectionStatus === "pending";
        const financials = await orderFinancialService.getByOrderId(orderId);
        return {
            ...summary,
            addressLine: deliveryAddress,
            customer: { name: row.customerName, phone: row.customerPhone },
            delivery: {
                address: row.addressLine,
                landmark: row.landmark,
                cityName: row.cityName,
                pincode: row.pincode,
                latitude: order?.deliveryLatitude ?? null,
                longitude: order?.deliveryLongitude ?? null,
            },
            items,
            canChat: await this.resolveCanChat(partner, vendorId, orderId, row),
            deliveryCodeSent,
            collectionStatus,
            collectionMethod,
            requiresCollection,
            vendorSharePaise: financials?.vendorSharePaise ?? null,
            platformFeePaise: financials?.platformFeePaise ?? null,
        };
    }

    private async publishBookingStatus(customerUserId: string, orderId: string, status: string) {
        if (!this.realtime) return;
        try {
            await this.realtime.publish({
                userId: customerUserId,
                event: BOOKING_STATUS_EVENT,
                payload: { orderId, status },
            });
        } catch (err) {
            logger.error({ err, orderId, status }, "booking status realtime publish failed");
        }
    }

    private async publishVendorJobUpdated(vendorId: string, orderId: string, status: string) {
        if (!this.realtime) return;
        try {
            const vendor = await this.vendors.findById(vendorId);
            if (!vendor?.userId) return;
            await this.realtime.publish({
                userId: vendor.userId,
                event: VENDOR_JOB_UPDATED_EVENT,
                payload: { orderId, status },
            });
        } catch (err) {
            logger.error({ err, orderId, status }, "vendor job updated realtime publish failed");
        }
    }

    private formatDeliveryAddress(order: PublicOrder): string {
        const parts = [order.delivery.address];
        if (order.delivery.landmark) {
            parts.push(order.delivery.landmark);
        }
        parts.push(`${order.delivery.cityName} ${order.delivery.pincode}`);
        return parts.filter(Boolean).join(", ");
    }

    private async vendorContact(vendorId: string): Promise<{ vendorName: string; vendorPhone: string }> {
        return {
            vendorName: await this.getVendorName(vendorId),
            vendorPhone: (await this.getVendorPhone(vendorId)) ?? "",
        };
    }

    private async notifyTripEvent(
        event: "VENDOR_EN_ROUTE" | "VENDOR_ON_SITE" | "DELIVERY_CODE" | "BOOKING_COMPLETED",
        order: PublicOrder,
        customerUserId: string,
        idempotencyKey: string,
        extra: Record<string, string> = {},
    ) {
        const vendorName = extra.vendorName ?? "Your decorator";
        try {
            await this.notifications.notify({
                event,
                userId: customerUserId,
                recipient: {
                    email: order.customer.email,
                    phone: order.customer.phone,
                },
                data: {
                    customerName: order.customer.name,
                    orderRef: order.reference,
                    bookingId: order.id,
                    orderId: order.id,
                    trackUrl: bookingTrackUrl(order.id),
                    scheduledAt: order.scheduledAt,
                    vendorName,
                    vendorPhone: extra.vendorPhone ?? "",
                    address: this.formatDeliveryAddress(order),
                    cityName: order.delivery.cityName,
                    ...extra,
                },
                idempotencyKey,
            });
        } catch (err) {
            logger.error({ err, orderId: order.id, event }, "trip notification failed");
        }
    }

    private async notifyCustomerBookingAssigned(
        order: PublicOrder,
        customerUserId: string | null | undefined,
        options: { vendorName: string; vendorPhone: string; idempotencyKey: string },
    ) {
        if (!customerUserId) {
            logger.warn({ orderId: order.id }, "booking assigned notify skipped — no customer userId");
            return;
        }
        try {
            await this.notifications.notify({
                event: "BOOKING_ASSIGNED",
                userId: customerUserId,
                recipient: {
                    email: order.customer.email,
                    phone: order.customer.phone,
                },
                data: {
                    event: "BOOKING_ASSIGNED",
                    customerName: order.customer.name,
                    orderRef: order.reference,
                    bookingId: order.id,
                    orderId: order.id,
                    trackUrl: bookingTrackUrl(order.id),
                    scheduledAt: formatBookingSchedule(order.scheduledAt),
                    address: this.formatDeliveryAddress(order),
                    vendorName: options.vendorName,
                    vendorPhone: options.vendorPhone,
                },
                idempotencyKey: options.idempotencyKey,
            });
        } catch (err) {
            logger.error({ err, orderId: order.id }, "customer booking assigned notify failed");
        }
    }

    async listJobs(
        partner: PartnerContext,
        filter: "today" | "upcoming" | "completed" | "action" | undefined,
        pagination: PaginationQuery,
        search?: string,
    ) {
        const vendorId = partner.vendorId;
        let orderIds: string[] | undefined;
        if (partner.mode === "field") {
            if (filter === "action") {
                return { items: [], total: 0 };
            }
            orderIds = await this.fieldAssignments.listOrderIdsForMember(partner.memberId);
        }
        const result = await this.jobs.listForVendor(
            vendorId,
            filter,
            pagination,
            orderIds,
            search,
        );
        return {
            items: result.items.map(toSummary),
            total: result.total,
        };
    }

    async getJob(partner: PartnerContext, orderId: string): Promise<VendorJobDetail> {
        const vendorId = partner.vendorId;
        const row = await this.jobs.findJobForVendor(vendorId, orderId);
        if (!row) {
            throw ApiError.notFound("job not found");
        }
        if (partner.mode === "field") {
            const assigned = await this.fieldAssignments.isMemberAssigned(partner.memberId, orderId);
            if (!assigned) {
                throw ApiError.notFound("job not found");
            }
        }
        return this.buildJobDetail(partner, vendorId, orderId, row);
    }

    async getJobRoute(partner: PartnerContext, orderId: string): Promise<RouteResult> {
        const vendorId = partner.vendorId;
        const row = await this.jobs.findJobForVendor(vendorId, orderId);
        if (!row) {
            throw ApiError.notFound("job not found");
        }
        if (partner.mode === "field") {
            const assigned = await this.fieldAssignments.isMemberAssigned(partner.memberId, orderId);
            if (!assigned) {
                throw ApiError.notFound("job not found");
            }
        }
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        return buildOrderTripRoute(order);
    }

    async getJobTracking(partner: PartnerContext, orderId: string): Promise<PublicOrderTracking> {
        const vendorId = partner.vendorId;
        const row = await this.jobs.findJobForVendor(vendorId, orderId);
        if (!row) {
            throw ApiError.notFound("job not found");
        }
        if (partner.mode === "field") {
            const assigned = await this.fieldAssignments.isMemberAssigned(partner.memberId, orderId);
            if (!assigned) {
                throw ApiError.notFound("job not found");
            }
        }
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        return buildOrderTracking(order);
    }

    async acceptJob(partner: PartnerContext, orderId: string): Promise<VendorJobDetail> {
        this.assertOwnerMode(partner);
        const vendorId = partner.vendorId;
        const vendor = await this.vendors.findById(vendorId);
        if (!vendor?.isOnDuty) {
            throw ApiError.conflict("go online to accept bookings");
        }
        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment || assignment.vendorId !== vendorId || assignment.vendorResponse !== "pending") {
            throw ApiError.conflict("assignment is not pending for this vendor");
        }

        const orderRecord = await this.orders.findById(orderId);
        if (!orderRecord) {
            throw ApiError.notFound("order not found");
        }
        const memberRepo = new VendorMemberRepository();
        if (
            await isOrderCustomerConflictWithVendor(orderRecord.userId, vendorId, {
                vendors: this.vendors,
                members: memberRepo,
            })
        ) {
            const err = ApiError.conflict("customer cannot accept their own booking");
            err.code = SELF_DEALING_CODE;
            throw err;
        }

        await db.transaction(async (tx) => {
            const updated = await this.assignments.respondToAssignment(
                assignment.id,
                vendorId,
                "accepted",
                tx,
            );
            if (!updated) {
                throw ApiError.conflict("could not accept job");
            }
            const assigned = await this.orders.markAssigned(orderId, tx);
            if (!assigned) {
                throw ApiError.conflict("order could not be assigned");
            }
        });

        const order = await this.reloadOrder(orderId);
        const dbOrder = await this.orders.findById(orderId);
        const vendorName = await this.getVendorName(vendorId);
        const vendorPhone = (await this.getVendorPhone(vendorId)) ?? "";

        await this.notifyCustomerBookingAssigned(order, dbOrder?.userId, {
            vendorName,
            vendorPhone,
            idempotencyKey: `booking-assigned:${orderId}`,
        });

        try {
            await this.bookingChat?.ensureBookingConversation(orderId);
        } catch (err) {
            logger.error({ err, orderId }, "ensure booking conversation failed");
        }

        try {
            const { getDispatchService } = await import("@/modules/dispatch/index.js");
            await getDispatchService().onVendorAccepted(orderId);
        } catch (err) {
            logger.error({ err, orderId }, "dispatch accept hook failed");
        }

        return this.getJob(partner, orderId);
    }

    async declineJob(partner: PartnerContext, orderId: string): Promise<void> {
        this.assertOwnerMode(partner);
        const vendorId = partner.vendorId;
        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment || assignment.vendorId !== vendorId || assignment.vendorResponse !== "pending") {
            throw ApiError.conflict("assignment is not pending for this vendor");
        }

        const updated = await this.assignments.respondToAssignment(
            assignment.id,
            vendorId,
            "declined",
        );
        if (!updated) {
            throw ApiError.conflict("could not decline job");
        }

        try {
            const { getDispatchService } = await import("@/modules/dispatch/index.js");
            await getDispatchService().onVendorDeclined(orderId, vendorId);
        } catch (err) {
            logger.error({ err, orderId }, "dispatch decline hook failed");
        }
    }

    async postJobLocation(
        partner: PartnerContext,
        orderId: string,
        input: { latitude: number; longitude: number; heading?: number; speed?: number },
    ): Promise<{ suggestOnSite: boolean }> {
        await this.assertFieldModeJob(partner, orderId);
        const vendorId = partner.vendorId;
        const order = await this.assertActiveVendorJob(vendorId, orderId);
        const { assertCanPostLocation } = await import(
            "@/modules/dispatch/tracking/tracking.service.js"
        );
        const { setBookingLocation } = await import("@/modules/dispatch/geo/vendor-geo.store.js");
        const { haversineDistanceMeters } = await import("@/modules/dispatch/lib/haversine.js");
        assertCanPostLocation(order);
        await setBookingLocation(orderId, {
            latitude: input.latitude,
            longitude: input.longitude,
            heading: input.heading,
            speed: input.speed,
            at: new Date().toISOString(),
        });

        const ON_SITE_HINT_RADIUS_M = 120;
        let suggestOnSite = false;
        if (
            order.status === "EN_ROUTE" &&
            order.deliveryLatitude != null &&
            order.deliveryLongitude != null
        ) {
            const distanceM = haversineDistanceMeters(
                input.latitude,
                input.longitude,
                order.deliveryLatitude,
                order.deliveryLongitude,
            );
            suggestOnSite = distanceM <= ON_SITE_HINT_RADIUS_M;
        }
        return { suggestOnSite };
    }

    async markEnRoute(partner: PartnerContext, orderId: string): Promise<VendorJobDetail> {
        await this.assertFieldModeJob(partner, orderId);
        const vendorId = partner.vendorId;
        const order = await this.assertActiveVendorJob(vendorId, orderId);

        if (order.status === "EN_ROUTE") {
            return this.getJob(partner, orderId);
        }

        assertTransition(order.status, "EN_ROUTE");
        const updated = await this.orders.markEnRoute(orderId);
        if (!updated) {
            throw ApiError.conflict("order could not be marked en route");
        }

        const publicOrder = await this.reloadOrder(orderId);
        const { vendorName, vendorPhone } = await this.vendorContact(vendorId);
        await this.notifyTripEvent(
            "VENDOR_EN_ROUTE",
            publicOrder,
            order.userId,
            `trip:en-route:${orderId}`,
            { vendorName, vendorPhone },
        );
        await this.publishBookingStatus(order.userId, orderId, "EN_ROUTE");
        await this.publishVendorJobUpdated(vendorId, orderId, "EN_ROUTE");

        return this.getJob(partner, orderId);
    }

    async markOnSite(partner: PartnerContext, orderId: string): Promise<VendorJobDetail> {
        await this.assertFieldModeJob(partner, orderId);
        const vendorId = partner.vendorId;
        const order = await this.assertActiveVendorJob(vendorId, orderId);

        if (order.status === "ON_SITE") {
            return this.getJob(partner, orderId);
        }

        assertTransition(order.status, "ON_SITE");
        const updated = await this.orders.markOnSite(orderId);
        if (!updated) {
            throw ApiError.conflict("order could not be marked on site");
        }

        const publicOrder = await this.reloadOrder(orderId);
        const { vendorName, vendorPhone } = await this.vendorContact(vendorId);
        await this.notifyTripEvent(
            "VENDOR_ON_SITE",
            publicOrder,
            order.userId,
            `trip:on-site:${orderId}`,
            { vendorName, vendorPhone },
        );
        await this.publishBookingStatus(order.userId, orderId, "ON_SITE");
        await this.publishVendorJobUpdated(vendorId, orderId, "ON_SITE");

        return this.getJob(partner, orderId);
    }

    async sendDeliveryCode(partner: PartnerContext, orderId: string): Promise<VendorJobDetail> {
        await this.assertFieldModeJob(partner, orderId);
        const vendorId = partner.vendorId;
        const order = await this.assertActiveVendorJob(vendorId, orderId);

        if (order.status !== "ON_SITE") {
            throw ApiError.conflict("delivery code can only be sent when on site");
        }

        if (order.paymentMethod === "COD" && order.collectionStatus === "pending") {
            throw ApiError.conflict("collect payment before sending delivery code");
        }

        await assertDeliveryCodeSendRateLimit(orderId);
        const code = generateDeliveryCode();
        const sentAt = await saveDeliveryCode(orderId, code, vendorId);

        const publicOrder = await this.reloadOrder(orderId);
        const { vendorName, vendorPhone } = await this.vendorContact(vendorId);
        await this.notifyTripEvent(
            "DELIVERY_CODE",
            publicOrder,
            order.userId,
            `delivery-code:${orderId}:${sentAt}`,
            { vendorName, vendorPhone, code },
        );

        return this.getJob(partner, orderId);
    }

    async completeJob(partner: PartnerContext, orderId: string, code: string): Promise<VendorJobDetail> {
        await this.assertFieldModeJob(partner, orderId);
        const vendorId = partner.vendorId;
        const order = await this.assertActiveVendorJob(vendorId, orderId);

        if (order.status === "COMPLETED") {
            return this.getJob(partner, orderId);
        }

        if (order.status !== "ON_SITE") {
            throw ApiError.conflict("order must be on site to complete");
        }

        const codePending = await hasDeliveryCodePending(orderId);
        if (!codePending) {
            throw ApiError.conflict("delivery code not sent");
        }

        await consumeDeliveryCode(orderId, code.trim());

        const updated = await this.orders.markCompleted(orderId);
        if (!updated) {
            throw ApiError.conflict("order could not be completed");
        }

        await cancelBookingReminders(orderId);

        const publicOrder = await this.reloadOrder(orderId);
        const { vendorName, vendorPhone } = await this.vendorContact(vendorId);
        await this.notifyTripEvent(
            "BOOKING_COMPLETED",
            publicOrder,
            order.userId,
            `trip:completed:${orderId}`,
            { vendorName, vendorPhone },
        );
        await this.publishBookingStatus(order.userId, orderId, "COMPLETED");
        await this.publishVendorJobUpdated(vendorId, orderId, "COMPLETED");

        try {
            await this.bookingChat?.closeBookingConversation(orderId);
        } catch (err) {
            logger.error({ err, orderId }, "close booking conversation failed");
        }

        try {
            const posted = await ledgerService.postOnComplete(orderId, vendorId);
            if (!posted) {
                logger.info({ orderId, vendorId }, "ledger post-on-complete skipped (already posted)");
            }
        } catch (err) {
            logger.error({ err, orderId, vendorId }, "ledger post-on-complete failed; enqueueing retry");
            try {
                const queues = getQueues();
                await queues.ledgerPostOnComplete.add(
                    "post-on-complete",
                    { orderId },
                    {
                        jobId: buildBullJobId("ledger", "complete", orderId),
                        removeOnComplete: true,
                    },
                );
            } catch (enqueueErr) {
                logger.error({ enqueueErr, orderId }, "ledger post-on-complete enqueue failed");
            }
        }

        return this.getJob(partner, orderId);
    }

    async listFieldAssignments(partner: PartnerContext, orderId: string) {
        this.assertOwnerMode(partner);
        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment || assignment.vendorId !== partner.vendorId) {
            throw ApiError.notFound("job not found");
        }
        return this.fieldAssignments.listForOrder(partner.vendorId, orderId);
    }

    async setFieldAssignments(partner: PartnerContext, orderId: string, memberIds: string[]) {
        this.assertOwnerMode(partner);
        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment || assignment.vendorId !== partner.vendorId) {
            throw ApiError.notFound("job not found");
        }
        if (assignment.vendorResponse !== "accepted") {
            throw ApiError.conflict("accept the job before assigning workers");
        }
        const uniqueIds = [...new Set(memberIds)];
        if (uniqueIds.length > 1) {
            throw ApiError.badRequest("only one worker per job");
        }
        for (const memberId of uniqueIds) {
            const member = await this.vendorMembers.findByIdForVendor(partner.vendorId, memberId);
            if (!member || member.status !== "active") {
                throw ApiError.badRequest("invalid team member");
            }
            if (!member.userId) {
                throw ApiError.badRequest("worker must accept invite before assignment");
            }
        }
        const rows = await this.fieldAssignments.replaceForOrder(
            partner.vendorId,
            orderId,
            uniqueIds,
            partner.userId,
        );
        await auditService.log({
            actorId: partner.userId,
            action: "order.field_assigned",
            entityType: "order",
            entityId: orderId,
            summary: `Assigned ${uniqueIds.length} worker(s) to job`,
            after: { memberIds: uniqueIds },
        });
        await this.notifyFieldAssignees(partner.vendorId, orderId, rows);
        if (rows.length > 0) {
            const customerOrder = await this.reloadOrder(orderId);
            const dbOrder = await this.orders.findById(orderId);
            const worker = rows[0];
            const workerPhone =
                (await this.resolveWorkerNotifyPhone(partner.vendorId, worker)) ?? "";
            const workerName =
                worker.displayName.trim() || (await this.getVendorName(partner.vendorId));
            await this.notifyCustomerBookingAssigned(customerOrder, dbOrder?.userId, {
                vendorName: workerName,
                vendorPhone: workerPhone,
                idempotencyKey: `booking-field-worker:${orderId}:${worker.memberId}`,
            });
        }
        try {
            await this.bookingChat?.syncBookingFieldWorker(orderId, partner.vendorId);
        } catch (err) {
            logger.error({ err, orderId }, "sync booking chat field worker failed");
        }
        return rows;
    }

    async assignSelfToJob(partner: PartnerContext, orderId: string) {
        this.assertOwnerMode(partner);
        if (!partner.memberId) {
            throw ApiError.conflict("owner membership required");
        }
        return this.setFieldAssignments(partner, orderId, [partner.memberId]);
    }

    private async resolveWorkerNotifyPhone(
        vendorId: string,
        row: FieldAssignmentWithMember,
    ): Promise<string | undefined> {
        if (row.userId) {
            const user = await this.users.findById(row.userId);
            const fromUser = user?.phone?.trim();
            if (fromUser) return fromUser;
        }
        const member = await this.vendorMembers.findByIdForVendor(vendorId, row.memberId);
        const fromInvite = member?.invitedPhone?.trim();
        return fromInvite || undefined;
    }

    private async notifyFieldAssignees(
        vendorId: string,
        orderId: string,
        rows: FieldAssignmentWithMember[],
    ) {
        if (!rows.length) return;

        let assignedOrder: PublicOrder;
        try {
            assignedOrder = await this.reloadOrder(orderId);
        } catch (err) {
            logger.error({ err, orderId }, "field assign notify could not load order");
            return;
        }

        const orderRef = assignedOrder.reference;
        const scheduledAt = formatBookingSchedule(assignedOrder.scheduledAt);
        const address = assignedOrder.delivery.address;

        for (const row of rows) {
            if (!row.userId) continue;

            const phone = await this.resolveWorkerNotifyPhone(vendorId, row);
            if (!phone) {
                logger.warn(
                    { orderId, memberId: row.memberId, userId: row.userId },
                    "field assign notify skipped SMS — no worker phone",
                );
            }

            try {
                await this.notifications.notify({
                    event: "VENDOR_JOB_ASSIGNED",
                    userId: row.userId,
                    recipient: { phone },
                    data: {
                        event: "VENDOR_JOB_ASSIGNED",
                        audience: "field",
                        orderId,
                        bookingId: orderId,
                        orderRef,
                        scheduledAt,
                        address,
                    },
                    idempotencyKey: `vendor-job-assigned:${orderId}:${row.memberId}`,
                });
            } catch (err) {
                logger.error({ err, orderId, memberId: row.memberId }, "field assign notify failed");
                continue;
            }

            if (!this.realtime) continue;
            try {
                await this.realtime.publish({
                    userId: row.userId,
                    event: VENDOR_JOB_ASSIGNED_EVENT,
                    payload: { orderId },
                });
            } catch (err) {
                logger.error(
                    { err, orderId, userId: row.userId },
                    "field assign realtime publish failed",
                );
            }
        }
    }

    private async getVendorName(vendorId: string): Promise<string> {
        const detail = await this.vendors.findAdminDetail(vendorId);
        return detail?.name ?? "Your decorator";
    }

    private async getVendorPhone(vendorId: string): Promise<string | null> {
        const detail = await this.vendors.findAdminDetail(vendorId);
        return detail?.phone ?? null;
    }
}
