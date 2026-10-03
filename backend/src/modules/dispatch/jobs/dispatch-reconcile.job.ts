import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { getDispatchService } from "@/modules/dispatch/index.js";
import { DispatchOfferRepository } from "@/modules/dispatch/offers/dispatch-offer.repository.js";
import { settingService } from "@/modules/ops/index.js";
import { logger } from "@/utils/logger.js";

const STALE_SEARCHING_MS = 2 * 60 * 1000;

export async function processDispatchReconcileJob(): Promise<void> {
    const policy = await settingService.getInstantDispatchPolicy();
    if (!policy.enabled) return;

    const cutoff = new Date(Date.now() - STALE_SEARCHING_MS);
    const offers = new DispatchOfferRepository();
    const dispatch = getDispatchService();

    const staleRows = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
            and(
                eq(orders.fulfillmentType, "instant"),
                eq(orders.status, "CONFIRMED"),
                eq(orders.dispatchStatus, "searching"),
                lt(orders.updatedAt, cutoff),
            ),
        );

    for (const row of staleRows) {
        const offerCount = await offers.countOffersForOrder(row.id);
        if (offerCount > 0) continue;

        await dispatch.exhaustInstantDispatch(row.id);
        logger.warn({ orderId: row.id }, "dispatch reconcile exhausted stale searching order");
    }
}
