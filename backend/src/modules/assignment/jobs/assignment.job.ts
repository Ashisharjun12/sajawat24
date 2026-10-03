import type { Job } from "bullmq";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { bookingTrackUrl } from "@/modules/notifications/lib/render.js";
import { notificationService } from "@/modules/notifications/index.js";
import { formatBookingSchedule } from "@/modules/notifications/templates/email/booking-confirmed.render.js";
import { logger } from "@/utils/logger.js";

const REMINDER_ELIGIBLE_STATUSES = new Set(["CONFIRMED", "ASSIGNED", "EN_ROUTE"]);

export type AssignmentReminderJobData = {
    orderId: string;
    offsetKey: "24h" | "4h";
};

export async function processAssignmentReminderJob(
    job: Job<AssignmentReminderJobData>,
): Promise<void> {
    const { orderId, offsetKey } = job.data;
    const orders = new OrderRepository();
    const order = await orders.findById(orderId);

    if (!order || !REMINDER_ELIGIBLE_STATUSES.has(order.status)) {
        return;
    }

    try {
        await notificationService.notify({
            event: "BOOKING_REMINDER",
            userId: order.userId,
            recipient: {
                phone: order.customerPhone,
                email: order.customerEmail || undefined,
            },
            data: {
                customerName: order.customerName,
                orderRef: order.reference,
                orderId: order.id,
                bookingId: order.id,
                scheduledAt: formatBookingSchedule(order.scheduledAt.toISOString()),
                trackUrl: bookingTrackUrl(order.id),
                reminderOffset: offsetKey,
            },
            idempotencyKey: `booking-reminder:${orderId}:${offsetKey}`,
        });
    } catch (err) {
        logger.error({ err, orderId, offsetKey }, "booking reminder notify failed");
        throw err;
    }
}
