import type { Order } from "@/modules/booking/orders/order.schema.js";

/**
 * Online checkout was started but payment never completed (user left gateway or
 * `cancelPendingPaymentForUser` / stale-payment job). Distinct from a confirmed
 * booking that was later cancelled (`idempotencyKey` stays set).
 */
export function isCheckoutAbandonedOrder(
    order: Pick<Order, "status" | "paymentMethod" | "idempotencyKey">,
): boolean {
    return (
        order.status === "CANCELLED" &&
        order.paymentMethod === "ONLINE" &&
        (order.idempotencyKey == null || order.idempotencyKey === "")
    );
}
