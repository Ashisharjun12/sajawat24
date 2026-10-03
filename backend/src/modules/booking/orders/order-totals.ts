import type { Order } from "@/modules/booking/orders/order.schema.js";

export function orderPayablePaise(order: Pick<Order, "subtotalPaise" | "discountPaise">): number {
    return Math.max(0, order.subtotalPaise - (order.discountPaise ?? 0));
}
