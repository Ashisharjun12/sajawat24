import { _config } from "@/config/config.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { PaymentIntentRepository } from "@/modules/payments/intents/payment-intent.repository.js";
import { logger } from "@/utils/logger.js";

const orders = new OrderRepository();
const intents = new PaymentIntentRepository();

export async function processStalePendingPaymentJob(): Promise<void> {
    const ttlMinutes = _config.BOOKING_PAYMENT_TTL_MINUTES;
    const olderThan = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const orderIds = await orders.listStalePendingPaymentOrderIds(olderThan, 40);
    if (orderIds.length === 0) return;

    let cancelled = 0;
    for (const orderId of orderIds) {
        const order = await orders.findById(orderId);
        if (!order || order.status !== "PENDING_PAYMENT") continue;
        const row = await orders.cancelPendingPaymentForUser(orderId, order.userId);
        if (!row) continue;
        await intents.markFailed(orderId);
        cancelled += 1;
    }

    if (cancelled > 0) {
        logger.info({ cancelled, ttlMinutes }, "cancelled stale pending payment orders");
    }
}
