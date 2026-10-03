import { and, eq, ne } from "drizzle-orm";
import { _config } from "@/config/config.js";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";
import { formatBookingSchedule } from "@/modules/notifications/templates/email/booking-confirmed.render.js";
import { settingService } from "@/modules/ops/index.js";
import { DispatchOfferRepository } from "@/modules/dispatch/offers/dispatch-offer.repository.js";
import { listDispatchCandidates } from "@/modules/dispatch/matching/dispatch-candidate.service.js";
import { buildBullJobId } from "@/infrastructure/queue/bull-job-id.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { logger } from "@/utils/logger.js";
import { VENDOR_JOB_ASSIGNED_EVENT } from "@/modules/assignment/lib/assignment.events.js";
import { RealtimeFactory } from "@/infrastructure/realtime/realtime.factory.js";
import { listAdminNotificationEmails } from "@/modules/identity/admin/admin-notification-emails.js";

export class DispatchService {
    private readonly offers = new DispatchOfferRepository();

    constructor(
        private readonly orderRepo: IOrderRepository,
        private readonly assignments: IAssignmentRepository,
        private readonly vendorRepo: IVendorRepository,
        private readonly notifications: INotificationService,
        private readonly reloadOrder: (orderId: string) => Promise<{ reference: string; scheduledAt: string; delivery: { address: string }; id: string }>,
    ) {}

    async startDispatch(orderId: string): Promise<void> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) return;
        if (order.fulfillmentType !== "instant") return;
        if (order.status !== "CONFIRMED") return;
        if (order.dispatchStatus === "accepted" || order.dispatchStatus === "exhausted") return;

        const dispatchPolicy = await settingService.getInstantDispatchPolicy();
        if (!dispatchPolicy.enabled) {
            return;
        }

        await db
            .update(orders)
            .set({ dispatchStatus: "searching", updatedAt: new Date() })
            .where(eq(orders.id, orderId));

        try {
            await this.offerNext(orderId, 0);
        } catch (err) {
            await this.failDispatch(orderId, "offerNext failed in startDispatch", err);
        }
    }

    /** Public entry for reconciliation / ops when auto-dispatch cannot complete. */
    async exhaustInstantDispatch(orderId: string): Promise<void> {
        await this.markExhausted(orderId);
    }

    async offerNext(orderId: string, waveIndex: number): Promise<void> {
        const order = await this.orderRepo.findById(orderId);
        if (!order || order.fulfillmentType !== "instant" || order.status !== "CONFIRMED") return;
        if (order.dispatchStatus === "accepted" || order.dispatchStatus === "exhausted" || order.dispatchStatus === "cancelled") {
            return;
        }

        const dispatchPolicy = await settingService.getInstantDispatchPolicy();
        const offerCount = await this.offers.countOffersForOrder(orderId);
        if (offerCount >= dispatchPolicy.maxOffersPerOrder) {
            await this.markExhausted(orderId);
            return;
        }

        const waves = dispatchPolicy.radiusKmWaves;
        const radiusKm = waves[Math.min(waveIndex, waves.length - 1)] ?? 5;
        const tried = await this.offers.listTriedVendorIds(orderId);
        const candidates = await listDispatchCandidates({
            orderId,
            cityId: order.cityId,
            deliveryPincode: order.pincode,
            customerLat: order.deliveryLatitude,
            customerLng: order.deliveryLongitude,
            radiusKm,
            excludeVendorIds: tried,
            geoCount: dispatchPolicy.geoCount,
        });

        if (!candidates.length) {
            if (waveIndex + 1 < waves.length) {
                try {
                    await getQueues().dispatch.add(
                        "expand",
                        { orderId, waveIndex: waveIndex + 1 },
                        {
                            jobId: buildBullJobId("dispatch", "expand", orderId, waveIndex + 1),
                            delay: 500,
                        },
                    );
                } catch (err) {
                    await this.failDispatch(orderId, "failed to enqueue dispatch expand", err);
                }
                return;
            }
            await this.markExhausted(orderId);
            return;
        }

        const pick = candidates[0];
        const systemUserId = dispatchPolicy.systemUserId;
        if (!systemUserId) {
            logger.error({ orderId }, "instant dispatch missing systemUserId in settings");
            await this.markExhausted(orderId);
            return;
        }

        const expiresAt = new Date(Date.now() + dispatchPolicy.offerTtlSec * 1000);

        let scheduledOfferId: string | null = null;
        await db.transaction(async (tx) => {
            await this.offers.revokeActiveForOrder(orderId, tx);
            await this.assignments.upsertForOrder(
                {
                    orderId,
                    vendorId: pick.vendorId,
                    assignedBy: systemUserId,
                    vendorResponse: "pending",
                    source: "system",
                },
                tx,
            );
            const offer = await this.offers.insert(
                {
                    orderId,
                    vendorId: pick.vendorId,
                    round: waveIndex + 1,
                    distanceMeters: pick.distanceMeters,
                    status: "offered",
                    expiresAt,
                },
                tx,
            );
            scheduledOfferId = offer.id;

            await tx
                .update(orders)
                .set({ dispatchStatus: "offering", updatedAt: new Date() })
                .where(eq(orders.id, orderId));

            await tx
                .update(vendors)
                .set({ lastOfferedAt: new Date(), updatedAt: new Date() })
                .where(eq(vendors.id, pick.vendorId));
        });

        if (scheduledOfferId) {
            try {
                await getQueues().dispatch.add(
                    "expire",
                    { orderId, offerId: scheduledOfferId },
                    {
                        jobId: buildBullJobId("dispatch", "expire", scheduledOfferId),
                        delay: dispatchPolicy.offerTtlSec * 1000,
                    },
                );
            } catch (err) {
                await this.failDispatch(orderId, "failed to enqueue dispatch expire", err);
            }
        }

        const vendor = await this.vendorRepo.findById(pick.vendorId);
        if (!vendor) return;
        const assignedOrder = await this.reloadOrder(orderId);
        const vendorDetail = await this.vendorRepo.findAdminDetail(pick.vendorId);

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
                idempotencyKey: `vendor-new-job:dispatch:${orderId}:${pick.vendorId}`,
            });
        } catch (err) {
            logger.error({ err, orderId }, "dispatch vendor notify failed");
        }

        try {
            await RealtimeFactory.getProvider().publish({
                userId: vendor.userId,
                event: VENDOR_JOB_ASSIGNED_EVENT,
                payload: { orderId },
            });
        } catch (err) {
            logger.error({ err, orderId }, "dispatch vendor job offer realtime publish failed");
        }
    }

    async expireOffer(offerId: string, orderId: string): Promise<void> {
        const offer = await this.offers.findById(offerId);
        if (!offer || offer.orderId !== orderId || offer.status !== "offered") return;
        if (offer.expiresAt.getTime() > Date.now()) return;

        await this.offers.updateStatus(offerId, "expired");
        const order = await this.orderRepo.findById(orderId);
        if (!order || order.dispatchStatus === "accepted") return;

        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (assignment?.vendorId === offer.vendorId && assignment.vendorResponse === "pending") {
            await this.assignments.respondToAssignment(assignment.id, offer.vendorId, "declined");
        }

        const dispatchPolicy = await settingService.getInstantDispatchPolicy();
        const offerCount = await this.offers.countOffersForOrder(orderId);
        const waveIndex = Math.min(
            dispatchPolicy.radiusKmWaves.length - 1,
            Math.floor(offerCount / dispatchPolicy.maxOffersPerOrder),
        );
        await this.offerNext(orderId, waveIndex);
    }

    async onVendorDeclined(orderId: string, vendorId: string): Promise<void> {
        const order = await this.orderRepo.findById(orderId);
        if (!order || order.fulfillmentType !== "instant") return;

        const active = await this.offers.findActiveOfferedForOrder(orderId);
        if (active && active.vendorId === vendorId) {
            await this.offers.updateStatus(active.id, "declined");
        }

        const dispatchPolicy = await settingService.getInstantDispatchPolicy();
        const offerCount = await this.offers.countOffersForOrder(orderId);
        const waveIndex = Math.min(
            dispatchPolicy.radiusKmWaves.length - 1,
            Math.floor(offerCount / Math.max(1, dispatchPolicy.maxOffersPerOrder)),
        );
        await this.offerNext(orderId, waveIndex);
    }

    async onVendorAccepted(orderId: string): Promise<void> {
        const active = await this.offers.findActiveOfferedForOrder(orderId);
        if (active) {
            await this.offers.updateStatus(active.id, "accepted");
        }
        await db
            .update(orders)
            .set({ dispatchStatus: "accepted", updatedAt: new Date() })
            .where(eq(orders.id, orderId));
    }

    private async failDispatch(orderId: string, reason: string, err: unknown): Promise<void> {
        logger.error({ err, orderId, reason }, "instant dispatch failed");
        await this.markExhausted(orderId);
    }

    private async markExhausted(orderId: string): Promise<void> {
        const order = await this.orderRepo.findById(orderId);
        if (!order || order.fulfillmentType !== "instant") return;
        if (order.dispatchStatus === "exhausted") return;

        const [updated] = await db
            .update(orders)
            .set({
                dispatchStatus: "exhausted",
                dispatchExhaustedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), ne(orders.dispatchStatus, "exhausted")))
            .returning({ id: orders.id });

        if (!updated) return;

        const adminEmails = await listAdminNotificationEmails();
        if (!adminEmails.length) {
            logger.warn(
                { orderId },
                "instant dispatch exhausted but no admin notification email — set an admin user email or ADMIN_EMAIL",
            );
            return;
        }

        try {
            const assignedOrder = await this.reloadOrder(orderId);
            const adminUrl = `${_config.ADMIN_APP_ORIGIN}/bookings/${orderId}`;
            for (const adminEmail of adminEmails) {
                await this.notifications.notify({
                    event: "DISPATCH_EXHAUSTED",
                    recipient: { email: adminEmail },
                    data: {
                        orderRef: assignedOrder.reference,
                        city: order.cityName,
                        address: assignedOrder.delivery.address,
                        adminUrl,
                        orderId,
                    },
                    idempotencyKey: `dispatch-exhausted:${orderId}:${adminEmail}`,
                });
            }
        } catch (err) {
            logger.error({ err, orderId }, "dispatch exhausted admin notify failed");
        }
    }
}
